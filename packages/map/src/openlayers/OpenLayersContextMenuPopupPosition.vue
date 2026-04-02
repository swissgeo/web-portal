<script setup lang="ts">
import type { CoordinateSystem } from '@swissgeo/coordinates'

import { LV95 } from '@swissgeo/coordinates'
import log from '@swissgeo/log'
import { Check, Copy } from 'lucide-vue-next'
import proj4 from 'proj4'
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import coordinateFormat, {
    LV03Format,
    LV95Format,
    MGRSFormat,
    UTMFormat,
    WGS84Format,
} from '@/utils/coordinates/coordinateFormat'

import { useClipboard } from '../composables/useClipboard.composable'

const WHAT_3_WORDS_API_BASE_URL = 'https://api.what3words.com/v3'
const WHAT_3_WORDS_API_KEY = ''
const METERS_TO_FEET_FACTOR = 3.28084

const props = defineProps<{
    coordinate: [number, number] | null
    projection?: CoordinateSystem
}>()

const { t } = useI18n()

const currentProjection = computed(() => props.projection ?? LV95)

interface Row {
    label: string
    labelLink?: string | ((_value: string) => string)
    value: string
}

const rows = ref<Row[]>([])
const clipboards = ref<ReturnType<typeof useClipboard>[]>([])

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
    } catch (_error: unknown) {
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

        return `${elevation_m.toFixed(2)}m\n${elevation_ft.toFixed(2)}ft`
    } catch (_error: unknown) {
        log.error(`Error fetching elevation for coordinate: ${coord.toString()}`)
        return 'Error fetching elevation'
    }
}

watchEffect(() => {
    void (async () => {
        const coord = props.coordinate
        if (!coord) {
            rows.value = []
            clipboards.value = []
            return
        }

        const proj = currentProjection.value
        const lv95 = coordinateFormat(LV95Format, coord, proj)
        const lv03 = coordinateFormat(LV03Format, coord, proj)
        const wgs84Dec = coordinateFormat(WGS84Format, coord, proj, true)
        const utm = coordinateFormat(UTMFormat, coord, proj)
        const mgrs = coordinateFormat(MGRSFormat, coord, proj)

        // Read all translations synchronously before any await so watchEffect tracks the locale
        const elevationLabel = t('map.contextMenuPopup.elevation')

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
            {
                label: 'what3words',
                labelLink: (value) => `https://what3words.com/${value}`,
                value: w3wValue,
            },
            {
                label: elevationLabel,
                labelLink: 'https://www.swisstopo.admin.ch/en/swiss-reference-systems',
                value: elevation,
            },
        ]
        clipboards.value = rows.value.map(() => useClipboard())
    })()
})
</script>

<template>
    <div class="divide-y divide-gray-100">
        <div
            v-for="(row, index) in rows"
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
                @click="clipboards[index]?.copy(row.value)"
            >
                <Check
                    v-if="clipboards[index]?.copied"
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
