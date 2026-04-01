<script setup lang="ts">
import type { CoordinateSystem } from '@swissgeo/coordinates'

import proj4 from 'proj4'
import { LV95 } from '@swissgeo/coordinates'
import { Check, Copy } from 'lucide-vue-next'
import { computed, ref, watchEffect } from 'vue'

import { useClipboard } from '../composables/useClipboard.composable'

import coordinateFormat, {
    LV03Format,
    LV95Format,
    MGRSFormat,
    UTMFormat,
    WGS84Format,
} from '@/utils/coordinates/coordinateFormat'
import log from '@swissgeo/log'

const WHAT_3_WORDS_API_BASE_URL = 'https://api.what3words.com/v3'
const WHAT_3_WORDS_API_KEY = ''
const METERS_TO_FEET_FACTOR = 3.28084

const props = defineProps<{
    coordinate: [number, number] | null
    projection?: CoordinateSystem
}>()

const currentProjection = computed(() => props.projection ?? LV95)

interface Row {
    label: string
    labelLink?: string | ((value: string) => string)
    value: string
}

const rows = ref<Row[]>([])

const resolveLink = (row: Row): string | undefined => {
    if (typeof row.labelLink === 'function') {
        return row.labelLink(row.value)
    }
    return row.labelLink
}

const fetchW3WLink = async (w3wValue: string): Promise<string> => {
    try {
        const response = await fetch(
            `${WHAT_3_WORDS_API_BASE_URL}/convert-to-3wa?coordinates=${w3wValue}&key=${WHAT_3_WORDS_API_KEY}`
        )
        const data = await response.json()
        return String(data.words)
    } catch (error) {
        log.error(`Error fetching what3words value for coordinate: ${w3wValue}`)
        return 'Error fetching what3words'
    }
}

const fetchElevation = async (coord: [number, number]): Promise<string> => {
    try {
        const response = await fetch(
            `https://api3.geo.admin.ch/rest/services/height?easting=${coord[0]}&northing=${coord[1]}`
        )
        const data = await response.json()
        const elevation_m = parseFloat(data.height as string)
        const elevation_ft = elevation_m * METERS_TO_FEET_FACTOR
        console.log(elevation_m, elevation_ft)

        return `${elevation_m.toFixed(2)}m\n${elevation_ft.toFixed(2)}ft`
    } catch (error) {
        log.error(`Error fetching elevation for coordinate: ${coord}`)
        return 'Error fetching elevation'
    }
}

watchEffect(async () => {
    const coord = props.coordinate
    if (!coord) {
        rows.value = []
        return
    }

    const proj = currentProjection.value
    const lv95 = coordinateFormat(LV95Format, coord, proj)
    const lv03 = coordinateFormat(LV03Format, coord, proj)
    const wgs84Dec = coordinateFormat(WGS84Format, coord, proj, true)
    const utm = coordinateFormat(UTMFormat, coord, proj)
    const mgrs = coordinateFormat(MGRSFormat, coord, proj)

    const [lon, lat] = proj4(proj.epsg, 'EPSG:4326', coord)
    const w3wValue = await fetchW3WLink(`${lat.toFixed(6)},${lon.toFixed(6)}`)

    const elevation = await fetchElevation(coord)

    rows.value = [
        {
            label: LV95Format.label,
            labelLink: 'https://www.swisstopo.admin.ch/en/the-swiss-coordinates-system',
            value: lv95,
        },
        {
            label: LV03Format.label,
            labelLink: 'https://www.swisstopo.admin.ch/en/national-triangulation-network-lv03',
            value: lv03,
        },
        {
            label: WGS84Format.label,
            labelLink: 'https://epsg.io/4326',
            value: `${wgs84Dec}`,
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
        {
            label: 'what3words',
            labelLink: (value) => `https://what3words.com/${value}`,
            value: w3wValue,
        },
        {
            label: 'Elevation',
            labelLink: 'https://www.swisstopo.admin.ch/en/swiss-reference-systems',
            value: elevation,
        },
    ]
})

// One clipboard instance per row label, created once and reused
const ROW_LABELS = [
    'CH1903+ / LV95',
    'CH1903 / LV03',
    'WGS 84 (lat/lon)',
    'UTM',
    'MGRS',
    'what3words',
] as const
const clipboards = Object.fromEntries(ROW_LABELS.map((label) => [label, useClipboard()])) as Record<
    string,
    ReturnType<typeof useClipboard>
>
</script>

<template>
    <div class="divide-y divide-gray-100">
        <div
            v-for="row in rows"
            :key="row.label"
            class="flex items-center justify-between gap-4 px-4 py-2 hover:bg-gray-50"
        >
            <a
                v-if="resolveLink(row)"
                :href="resolveLink(row)"
                target="_blank"
                rel="noopener noreferrer"
                class="min-w-[120px] shrink-0 text-sm font-medium text-primary underline"
            >
                {{ row.label }}
            </a>
            <span
                v-else
                class="min-w-[120px] shrink-0 text-sm font-medium text-gray-700"
            >
                {{ row.label }}
            </span>
            <span class="flex-1 text-sm whitespace-pre-line text-gray-700">
                {{ row.value }}
            </span>
            <button
                class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                @click="clipboards[row.label]?.copy(row.value)"
            >
                <Check
                    v-if="clipboards[row.label]?.copied.value"
                    :size="14"
                    class="text-green-500"
                />
                <Copy
                    v-else
                    :size="14"
                />
            </button>
        </div>
    </div>
</template>
