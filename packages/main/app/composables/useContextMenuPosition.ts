import type { CoordinateSystem } from '@swissgeo/coordinates'
import type { Lang } from '@swissgeo/shared'
import type { UseClipboardReturn } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import log from '@swissgeo/log'
import { coordinateFormat, LV95Format, MGRSFormat, UTMFormat, WGS84Format } from '@swissgeo/map'
import { useClipboard } from '@vueuse/core'
import proj4 from 'proj4'
import { useI18n } from 'vue-i18n'

const METERS_TO_FEET_FACTOR = 3.28084

const LV95_LINKS: Partial<Record<Lang, string>> = {
    de: 'https://www.swisstopo.admin.ch/de/schweizer-koordinatensystem',
    fr: 'https://www.swisstopo.admin.ch/fr/le-systeme-de-coordonnees-suisse',
    it: 'https://www.swisstopo.admin.ch/it/il-sistema-di-coordinate-svizzero',
    en: 'https://www.swisstopo.admin.ch/en/the-swiss-coordinates-system',
}

const ELEVATION_LINKS: Partial<Record<Lang, string>> = {
    de: 'https://www.swisstopo.admin.ch/de/schweizerische-bezugssysteme',
    fr: 'https://www.swisstopo.admin.ch/fr/systemes-de-reference-suisses',
    it: 'https://www.swisstopo.admin.ch/it/sistemi-di-riferimento-geodetici-svizzeri',
    en: 'https://www.swisstopo.admin.ch/en/swiss-reference-systems',
}

interface Row {
    label: string
    labelLink?: string | ((_value: string) => string)
    value: string
}

export function useContextMenuPosition(
    coordinate: Ref | ComputedRef,
    projection: Ref<CoordinateSystem> | ComputedRef<CoordinateSystem>
) {
    const { t, locale } = useI18n()

    const swisstopoLink = (map: Partial<Record<Lang, string>>): string =>
        map[locale.value] ?? map.en!

    const rows = ref<Row[]>([])
    const isLoading = ref(false)
    const clipboards = ref<UseClipboardReturn<boolean>[]>([])

    const fetchElevation = async (coord: [number, number]): Promise<string> => {
        try {
            const response = await fetch(
                `https://api3.geo.admin.ch/rest/services/height?easting=${coord[0]}&northing=${coord[1]}`
            )
            const data = await response.json()
            if (!data || !data.height) {
                throw new Error('Invalid elevation data')
            }
            const elevationM = parseFloat(data.height)
            if (isNaN(elevationM)) {
                throw new Error('Elevation data is not a number')
            }
            const elevationFt = elevationM * METERS_TO_FEET_FACTOR

            return `${elevationM.toFixed(2)}m\n${elevationFt.toFixed(2)}ft`
        } catch (_error: unknown) {
            log.error(`Error fetching elevation for coordinate: ${coord.toString()}`)
            return t('map.contextMenuPopup.errorFetchingElevation')
        }
    }

    const fetchW3WLink = async (lat: number, lon: number): Promise<string | null> => {
        try {
            const data = await $fetch<{ words: string }>('/api/v1/what3words/convert-to-3wa', {
                query: { lat, lon },
            })
            return data.words
        } catch (_error: unknown) {
            log.error(`Error fetching what3words value for coordinate: ${lat},${lon}`)
            return null
        }
    }

    watchEffect(() => {
        void (async () => {
            const coord = coordinate.value
            if (!coord) {
                rows.value = []
                clipboards.value = []
                isLoading.value = false
                return
            }

            isLoading.value = true

            const proj = projection.value
            const lv95 = coordinateFormat(LV95Format, coord, proj)
            const wgs84Dec = coordinateFormat(WGS84Format, coord, proj, true)
            const utm = coordinateFormat(UTMFormat, coord, proj)
            const mgrs = coordinateFormat(MGRSFormat, coord, proj)

            const elevationLabel = t('map.contextMenuPopup.elevation')

            const [lon, lat] = proj4(proj.epsg, 'EPSG:4326', coord)
            const [w3wValue, elevation] = await Promise.all([
                fetchW3WLink(lat, lon),
                fetchElevation(coord),
            ])

            rows.value = [
                {
                    label: LV95Format.label,
                    labelLink: swisstopoLink(LV95_LINKS),
                    value: lv95,
                },
                {
                    label: WGS84Format.label,
                    labelLink: 'https://epsg.io/4326',
                    value: wgs84Dec,
                },
                {
                    label: UTMFormat.label,
                    labelLink: 'https://epsg.io/32632',
                    value: utm,
                },
                {
                    label: MGRSFormat.label,
                    value: mgrs,
                },
                ...(w3wValue !== null
                    ? [
                          {
                              label: 'what3words',
                              labelLink: (value: string) => `https://what3words.com/${value}`,
                              value: w3wValue,
                          },
                      ]
                    : []),
                {
                    label: elevationLabel,
                    labelLink: swisstopoLink(ELEVATION_LINKS),
                    value: elevation,
                },
            ]
            isLoading.value = false
        })()
    })

    watch(rows, (newRows) => {
        clipboards.value = newRows.map(() => useClipboard())
    })

    return {
        rows,
        isLoading,
        clipboards,
    }
}
