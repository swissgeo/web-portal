import type { SingleCoordinate } from '@swissgeo/coordinates'
import type { ActionDispatcher } from '@swissgeo/map'

import { LV95, WGS84 } from '@swissgeo/coordinates'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { usePositionStore } from '@swissgeo/map'
import { useToast } from '#imports'
import { isEqual } from 'es-toolkit'
import { defineStore } from 'pinia'
import proj4 from 'proj4'

interface GeolocationStoreState {
    /** Flag telling if the user has activated the geolocation feature */
    active: boolean
    /** Flag telling if the user has denied the geolocation usage in his/her browser settings */
    denied: boolean
    /** Flag telling if the geolocation position should always be at the center of the map */
    tracking: boolean
    /** Device position in the current application projection [x, y] */
    position: SingleCoordinate | undefined
    /** Accuracy of the geolocation position, in meters */
    accuracy: number
    /** Keeps track of the amount of errors that happened during geolocation activation */
    errorCount: number
    /**
     * Flag telling if this is the first time geolocation is activated — used to set optimal zoom
     */
    firstTime: boolean
}

let geolocationWatcherId: number | undefined

export const useGeolocationStore = defineStore('geolocation', {
    state: (): GeolocationStoreState => ({
        active: false,
        denied: false,
        tracking: true,
        position: undefined,
        accuracy: 0,
        errorCount: 0,
        firstTime: true,
    }),

    actions: {
        setGeolocationActive(active: boolean, dispatcher: ActionDispatcher): void {
            this.active = active

            if (this.active) {
                this.errorCount = 0

                if (this.position && this.tracking) {
                    setCenterIfInBounds(this.position, dispatcher)
                    this.accuracy = 50 * 1000 // 50km placeholder until real fix arrives
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        log.debug({
                            title: 'Geolocation store / setGeolocationActive',
                            titleColor: LogPreDefinedColor.Amber,
                            messages: ['Geolocation API current position', position],
                        })
                        geolocationWatcherId = navigator.geolocation.watchPosition(
                            (pos) => handleNewGeolocationPosition.call(this, pos, dispatcher),
                            (err) =>
                                handleGeolocationError.call(
                                    this,
                                    err,
                                    { reactivate: false },
                                    dispatcher
                                ),
                            { enableHighAccuracy: true }
                        )
                        handleNewGeolocationPosition.call(this, position, dispatcher)
                    },
                    (err) =>
                        handleGeolocationError.call(this, err, { reactivate: true }, dispatcher),
                    {
                        enableHighAccuracy: true,
                        maximumAge: 5 * 60 * 1000,
                        timeout: 2 * 60 * 1000,
                    }
                )
            } else if (geolocationWatcherId !== undefined) {
                log.debug({
                    title: 'Geolocation store / setGeolocationActive',
                    titleColor: LogPreDefinedColor.Amber,
                    messages: ['Clearing geolocation watcher'],
                })
                navigator.geolocation.clearWatch(geolocationWatcherId)
                geolocationWatcherId = undefined
            }
        },

        toggleGeolocation(dispatcher: ActionDispatcher): void {
            this.setGeolocationActive(!this.active, dispatcher)
        },

        setGeolocationTracking(tracking: boolean, dispatcher: ActionDispatcher): void {
            this.tracking = tracking
            if (this.tracking && this.position) {
                setCenterIfInBounds(this.position, dispatcher)
            }
        },

        setGeolocationDenied(denied: boolean, dispatcher: ActionDispatcher): void {
            this.denied = denied
            if (denied) {
                this.active = false
                this.tracking = false
            }
        },

        setGeolocationPosition(position: SingleCoordinate, dispatcher: ActionDispatcher): void {
            if (Array.isArray(position) && position.length === 2) {
                this.position = position
                if (this.tracking) {
                    const positionStore = usePositionStore()
                    positionStore.setCenter(position, dispatcher)
                }
            } else {
                log.debug({
                    title: 'Geolocation store / setGeolocationPosition',
                    titleColor: LogPreDefinedColor.Red,
                    messages: ['Invalid geolocation position received', position],
                })
            }
        },

        setGeolocationAccuracy(accuracy: number, dispatcher: ActionDispatcher): void {
            this.accuracy = accuracy
        },
    },
})

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function handleNewGeolocationPosition(
    this: ReturnType<typeof useGeolocationStore>,
    position: GeolocationPosition,
    dispatcher: ActionDispatcher
): void {
    log.debug({
        title: 'Geolocation store / handleNewGeolocationPosition',
        titleColor: LogPreDefinedColor.Amber,
        messages: ['Received position from geolocation', position],
    })
    this.errorCount = 0

    const positionStore = usePositionStore()
    const { coords } = position
    const positionProjected: SingleCoordinate = proj4(WGS84.epsg, positionStore.projection.epsg, [
        coords.longitude,
        coords.latitude,
    ])
    const accuracy = Math.round(position.coords.accuracy)

    // Center map BEFORE updating position to avoid setCenter disabling tracking
    if (this.tracking) {
        setCenterIfInBounds(positionProjected, dispatcher)
    }

    if (
        !isEqual(this.position as number[], positionProjected as number[]) ||
        this.accuracy !== accuracy
    ) {
        this.setGeolocationPosition(positionProjected, dispatcher)
        this.setGeolocationAccuracy(accuracy, dispatcher)
    }
}

function handleGeolocationError(
    this: ReturnType<typeof useGeolocationStore>,
    error: GeolocationPositionError,
    options: { reactivate?: boolean },
    dispatcher: ActionDispatcher
): void {
    const { reactivate = false } = options
    log.error({
        title: 'Geolocation API',
        titleColor: LogPreDefinedColor.Amber,
        messages: ['Geolocation activation failed', error],
    })

    const toast = useToast()

    // Use numeric constants directly — GeolocationPositionError is not available in all environments
    const PERMISSION_DENIED = 1
    const TIMEOUT = 3

    switch (error.code) {
        case PERMISSION_DENIED:
            this.setGeolocationDenied(true, dispatcher)
            toast.add({ title: 'Location permission denied', color: 'error' })
            break
        case TIMEOUT:
            this.setGeolocationActive(false, dispatcher)
            toast.add({ title: 'Location request timed out', color: 'warning' })
            break
        default:
            this.errorCount += 1
            if (this.errorCount < 3) {
                if (reactivate) {
                    this.setGeolocationActive(true, dispatcher)
                }
            } else {
                toast.add({ title: 'Unable to determine location', color: 'warning' })
                if (reactivate) {
                    this.setGeolocationActive(false, dispatcher)
                }
            }
    }
}

function setCenterIfInBounds(center: SingleCoordinate, dispatcher: ActionDispatcher): void {
    const positionStore = usePositionStore()
    const toast = useToast()

    const lv95BoundsInCurrentProjection = LV95.getBoundsAs(positionStore.projection)

    if (lv95BoundsInCurrentProjection?.isInBounds(center)) {
        if (!isEqual(positionStore.center as number[], center as number[])) {
            positionStore.setCenter(center, dispatcher)

            const store = useGeolocationStore()
            if (store.firstTime) {
                store.firstTime = false
                positionStore.setZoom(positionStore.projection.get1_25000ZoomLevel(), dispatcher)
            }
        }
    } else {
        log.warn({
            title: 'Geolocation store / setCenterIfInBounds',
            titleColor: LogPreDefinedColor.Amber,
            messages: [`Current geolocation is out of bounds: ${JSON.stringify(center)}`],
        })
        toast.add({ title: 'Location is outside the supported area', color: 'warning' })
    }
}
