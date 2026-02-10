// Mock coordinate constants locally to avoid importing the real '@swissgeo/coordinates' module in unit tests
const WGS84 = { epsg: 'EPSG:4326' }
const WEBMERCATOR = { epsg: 'EPSG:3857' }

import { createPinia, setActivePinia } from 'pinia'
import proj4 from 'proj4'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActionDispatcher } from '@/stores/types'

import usePositionStore from '@/stores/position'
import { useUiStore as useUIStore } from '@/stores/ui'

const dispatcher: ActionDispatcher = {
    name: 'position-store-unit-test',
}

vi.mock('@/stores/ui', () => ({
    useUiStore: vi.fn(() => ({
        setSize: vi.fn(),
        isSidebarOpen: false,
    })),
}))

describe('Position store tests', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('Angle is correctly normalized by the store', () => {
        it('Store starts with a rotation of 0', () => {
            const positionStore = usePositionStore()
            expect(positionStore.rotation).to.be.equal(0)
        })
        it('setAngle normalizes the angle', () => {
            const positionStore = usePositionStore()
            positionStore.setRotation(3 * Math.PI + Math.PI / 2, {
                name: 'position-store-unit-test',
            })
            expect(positionStore.rotation).to.be.closeTo(-(Math.PI / 2), 1e-9)
        })
    })

    describe('Zoom operations testing', () => {
        const screenSize = 100
        const lat = 45
        const lon = 8

        beforeEach(() => {
            const positionStore = usePositionStore()
            const uiStore = useUIStore()
            // Avoid importing the full '@swissgeo/coordinates' machinery in unit tests by
            // stubbing a minimal WebMercator-like projection with the methods the store expects.
            const fakeWebMercator = {
                epsg: WEBMERCATOR.epsg,
                getDefaultZoom: () => 0,
                roundZoomLevel: (z: number) => parseFloat(z.toFixed(3)),
                getResolutionForZoomAndCenter: (zoom: number, center: [number, number]) => {
                    const y = center[1]
                    const R = 6378137
                    const latRadians = 2 * Math.atan(Math.exp(y / R)) - Math.PI / 2
                    const latDegrees = (latRadians * 180) / Math.PI
                    // Use the standard Web Mercator meters-per-pixel at zoom 0 (≈156543.0339 m/px)
                    return (
                        (156543.0339 * Math.cos((latDegrees * Math.PI) / 180.0)) / Math.pow(2, zoom)
                    )
                },
                isInBounds: () => true,
                bounds: { center: [0, 0] },
            }

            // directly assign stubbed projection and center to avoid triggering projection parsing logic
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(positionStore as any).projection = fakeWebMercator

            // first we setup a fake screen of 100px by 100px
            uiStore.setSize(screenSize, screenSize, dispatcher)
            // we now then center the view on wanted coordinates (in WebMercator projection)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(positionStore as any).center = proj4(WGS84.epsg, WEBMERCATOR.epsg, [lon, lat])
        })

        it("Doesn't allow negative zoom level", () => {
            const positionStore = usePositionStore()
            // setting the zoom at a valid value, and then setting it at an invalid value => the valid value should persist
            const validZoomLevel = 10
            positionStore.setZoom(validZoomLevel, dispatcher)
            positionStore.setZoom(-1, dispatcher)
            expect(positionStore.zoom).to.eq(
                validZoomLevel,
                'Should not accept negative zoom level and ignore the value'
            )
        })
        it('Set zoom level correctly from what is given in "setZoom"', () => {
            const positionStore = usePositionStore()
            // checking zoom level 0 to 24
            for (let zoom = 0; zoom < 24; zoom += 1) {
                positionStore.setZoom(zoom, dispatcher)
                expect(positionStore.zoom).to.eq(zoom)
            }
        })
        it('Rounds zoom level to the third decimal if more are given', () => {
            const positionStore = usePositionStore()
            // flooring check
            positionStore.setZoom(5.4321, dispatcher)
            expect(positionStore.zoom).to.eq(5.432)
            // ceiling check
            positionStore.setZoom(5.6789, dispatcher)
            expect(positionStore.zoom).to.eq(5.679)
        })
        it('Calculate resolution from zoom levels according to OGC standard (with 0.1% error margin)', () => {
            const positionStore = usePositionStore()

            positionStore.setZoom(10, dispatcher)
            // see https://wiki.openstreetmap.org/wiki/Zoom_levels
            // at zoom level 10, resolution should be of about 152.746 meter per pixel adjusted to latitude
            const resolutionAtZoom10 = 152.746
            // we tolerate a 0.1% error margin
            let toleratedDelta = resolutionAtZoom10 / 1000.0
            expect(positionStore.resolution).to.approximately(
                resolutionAtZoom10 * Math.cos((lat * Math.PI) / 180.0),
                toleratedDelta
            )

            // we move to the equator so that resolution values should then match tables
            positionStore.setCenter(proj4(WGS84.epsg, WEBMERCATOR.epsg, [lon, 0]), dispatcher)
            expect(positionStore.resolution).to.approximately(resolutionAtZoom10, toleratedDelta)

            positionStore.setZoom(2, dispatcher)
            const resolutionAtZoom2 = 39103
            // we tolerate a 0.1% error margin
            toleratedDelta = resolutionAtZoom2 / 1000.0
            expect(positionStore.zoom).to.eq(2)
            // at zoom level 2, resolution should be of about 39'103 meter per pixel at equator
            expect(positionStore.resolution).to.approximately(resolutionAtZoom2, toleratedDelta)
            // let's go back to latitude 45 and check resolution again
            positionStore.setCenter(proj4(WGS84.epsg, WEBMERCATOR.epsg, [lon, lat]), dispatcher)
            expect(positionStore.resolution).to.approximately(
                resolutionAtZoom2 * Math.cos((lat * Math.PI) / 180.0),
                toleratedDelta
            )
        })
    })
})
