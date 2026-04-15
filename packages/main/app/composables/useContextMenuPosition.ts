import type { CoordinateSystem } from '@swissgeo/coordinates'
import type { Lang } from '@swissgeo/shared'
import type { ComputedRef, Ref } from 'vue'

import log from '@swissgeo/log'
import { coordinateFormat, LV95Format, MGRSFormat, UTMFormat, WGS84Format } from '@swissgeo/map'
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

export interface Row {
    label: string
    labelLink?: string | ((_value: string) => string)
    value: string
}

export function useContextMenuPosition(
    coordinate: Ref<[number, number] | null> | ComputedRef<[number, number] | null>,
    projection: Ref<CoordinateSystem> | ComputedRef<CoordinateSystem>
) {
    const { t, locale } = useI18n()

    const swisstopoLink = (map: Partial<Record<Lang, string>>): string =>
        map[locale.value] ?? map.en!

    const latLon = computed<{ lat: number; lon: number } | null>(() => {
        const coord = coordinate.value
        if (!coord) {
            return null
        }
        const [lon, lat] = proj4(projection.value.epsg, 'EPSG:4326', coord)
        return { lat, lon }
    })

    const { data: w3wData, pending: w3wPending } = useAsyncData(
        () => `w3w-${latLon.value?.lat}-${latLon.value?.lon}`,
        async () => {
            if (!latLon.value) {
                return null
            }
            const { lat, lon } = latLon.value
            return $fetch<{ words: string }>('/api/v1/what3words/convert-to-3wa', {
                query: { lat, lon },
            }).catch((error) => {
                log.error(`Error fetching what3words value: ${String(error)}`)
                return null
            })
        },
        { watch: [latLon] }
    )

    const { data: elevationData, pending: elevationPending } = useAsyncData(
        () => `elevation-${coordinate.value?.[0]}-${coordinate.value?.[1]}`,
        async () => {
            if (!coordinate.value) {
                return null
            }
            const [easting, northing] = coordinate.value
            return $fetch<{ height: string }>('/api/v1/elevation/height', {
                query: { easting, northing },
            }).catch((error) => {
                log.error(`Error fetching elevation: ${String(error)}`)
                return null
            })
        },
        { watch: [coordinate] }
    )

    const isLoading = computed(() => w3wPending.value || elevationPending.value)

    const elevationFormatted = computed<string | null>(() => {
        const raw = elevationData.value?.height
        if (!raw) {
            return null
        }
        const elevationM = parseFloat(raw)
        if (isNaN(elevationM)) {
            return null
        }
        const elevationFt = elevationM * METERS_TO_FEET_FACTOR
        return `${elevationM.toFixed(2)}m\n${elevationFt.toFixed(2)}ft`
    })

    const rows = computed<Row[]>(() => {
        const coord = coordinate.value
        const proj = projection.value
        if (!coord || isLoading.value) {
            return []
        }

        const w3wWords = w3wData.value?.words ?? null
        const elevation =
            elevationFormatted.value ?? t('map.contextMenuPopup.errorFetchingElevation')

        return [
            {
                label: LV95Format.label,
                labelLink: swisstopoLink(LV95_LINKS),
                value: coordinateFormat(LV95Format, coord, proj),
            },
            {
                label: WGS84Format.label,
                labelLink: 'https://epsg.io/4326',
                value: coordinateFormat(WGS84Format, coord, proj, true),
            },
            {
                label: UTMFormat.label,
                labelLink: 'https://epsg.io/32632',
                value: coordinateFormat(UTMFormat, coord, proj),
            },
            {
                label: MGRSFormat.label,
                value: coordinateFormat(MGRSFormat, coord, proj),
            },
            ...(w3wWords !== null
                ? [
                      {
                          label: 'what3words',
                          labelLink: (value: string) => `https://what3words.com/${value}`,
                          value: w3wWords,
                      },
                  ]
                : []),
            {
                label: t('map.contextMenuPopup.elevation'),
                labelLink: swisstopoLink(ELEVATION_LINKS),
                value: elevation,
            },
        ]
    })

    return {
        rows,
        isLoading,
    }
}
