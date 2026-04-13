<script setup lang="ts">
import type { CoordinateSystem } from '@swissgeo/coordinates'
import type { Lang } from '@swissgeo/shared'
import type { UseClipboardReturn } from '@vueuse/core'

import { LV95 } from '@swissgeo/coordinates'
import log from '@swissgeo/log'
import {
    coordinateFormat,
    LV03Format,
    LV95Format,
    MGRSFormat,
    UTMFormat,
    WGS84Format,
} from '@swissgeo/map'
import { useClipboard } from '@vueuse/core'
import proj4 from 'proj4'
import { useI18n } from 'vue-i18n'

const METERS_TO_FEET_FACTOR = 3.28084

const props = defineProps<{
    coordinate: [number, number] | null
    projection?: CoordinateSystem
}>()

const { t, locale } = useI18n()

const LV95_LINKS: Partial<Record<Lang, string>> = {
    de: 'https://www.swisstopo.admin.ch/de/schweizer-koordinatensystem',
    fr: 'https://www.swisstopo.admin.ch/fr/le-systeme-de-coordonnees-suisse',
    it: 'https://www.swisstopo.admin.ch/it/il-sistema-di-coordinate-svizzero',
    en: 'https://www.swisstopo.admin.ch/en/the-swiss-coordinates-system',
}

const LV03_LINKS: Partial<Record<Lang, string>> = {
    de: 'https://www.swisstopo.admin.ch/de/landestriangulation-lv03',
    fr: 'https://www.swisstopo.admin.ch/fr/mensuration-nationale-mn03',
    it: 'https://www.swisstopo.admin.ch/it/triangolazione-nazionale-mn03',
    en: 'https://www.swisstopo.admin.ch/en/national-triangulation-network-lv03',
}

const ELEVATION_LINKS: Partial<Record<Lang, string>> = {
    de: 'https://www.swisstopo.admin.ch/de/schweizerische-bezugssysteme',
    fr: 'https://www.swisstopo.admin.ch/fr/systemes-de-reference-suisses',
    it: 'https://www.swisstopo.admin.ch/it/sistemi-di-riferimento-geodetici-svizzeri',
    en: 'https://www.swisstopo.admin.ch/en/swiss-reference-systems',
}

const swisstopoLink = (map: Partial<Record<Lang, string>>): string => map[locale.value] ?? map.en!

const currentProjection = computed(() => props.projection ?? LV95)

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

interface Row {
    label: string
    labelLink?: string | ((_value: string) => string)
    value: string
}

const rows = ref<Row[]>([])
const isLoading = ref(false)

const clipboards = ref<UseClipboardReturn<boolean>[]>([])

watch(rows, (newRows) => {
    clipboards.value = newRows.map(() => useClipboard())
})

const resolveLink = (row: Row): string | undefined => {
    if (typeof row.labelLink === 'function') {
        return row.labelLink(row.value)
    }
    return row.labelLink
}

const resolvedLinks = computed(() => rows.value.map((row) => resolveLink(row)))

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

watchEffect(() => {
    void (async () => {
        const coord = props.coordinate
        if (!coord) {
            rows.value = []
            clipboards.value = []
            isLoading.value = false
            return
        }

        isLoading.value = true

        const proj = currentProjection.value
        const lv95 = coordinateFormat(LV95Format, coord, proj)
        const lv03 = coordinateFormat(LV03Format, coord, proj)
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
                label: LV03Format.label,
                labelLink: swisstopoLink(LV03_LINKS),
                value: lv03,
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
</script>

<template>
    <div class="divide-y divide-gray-100">
        <div
            v-if="isLoading"
            class="flex flex-col gap-2 px-4 py-3"
        >
            <div
                v-for="i in 6"
                :key="i"
                class="flex items-center justify-between gap-4"
            >
                <USkeleton class="h-4 w-30 rounded" />
                <USkeleton class="h-4 flex-1 rounded" />
                <USkeleton class="size-7 rounded" />
            </div>
        </div>
        <div
            v-else
            v-for="(row, index) in rows"
            :key="row.label"
            class="flex items-center justify-between gap-4 px-4 py-2 hover:bg-gray-50"
        >
            <ULink
                v-if="resolvedLinks[index]"
                :to="resolvedLinks[index]"
                target="_blank"
                rel="noopener noreferrer"
                class="min-w-30"
            >
                {{ row.label }}
            </ULink>
            <span
                v-else
                class="min-w-30"
            >
                {{ row.label }}
            </span>
            <span class="flex-1 text-sm whitespace-pre-line text-gray-700">
                {{ row.value }}
            </span>
            <UButton
                :icon="clipboards[index]?.copied ? 'i-lucide-check' : 'i-lucide-copy'"
                :class="clipboards[index]?.copied ? 'text-green-500' : ''"
                color="neutral"
                variant="ghost"
                square
                size="sm"
                @click="clipboards[index]?.copy(row.value)"
            />
        </div>
    </div>
</template>
