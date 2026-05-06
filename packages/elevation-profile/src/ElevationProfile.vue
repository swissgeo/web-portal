<script setup lang="ts">
import type { ElevationProfileResponse } from '@/types'

import { LV95, registerProj4, WGS84 } from '@swissgeo/coordinates'
import proj4 from 'proj4'
import { computed, ref } from 'vue'

import type { Labels as MetadataLabels } from './components/ElevationProfileMetadata.vue'
import type { Labels as PlotLabels } from './components/ElevationProfilePlot.vue'

import ElevationProfileMetadata from './components/ElevationProfileMetadata.vue'
import ElevationProfilePlot from './components/ElevationProfilePlot.vue'

registerProj4(proj4)

export interface Labels {
    plot: PlotLabels
    metadata: MetadataLabels
}

const props = withDefaults(
    defineProps<{
        profileResponse: ElevationProfileResponse
        isLoading: boolean
        labels: Labels
        filename?: string
    }>(),
    {
        filename: 'export',
    }
)

const isReverse = ref<boolean>(false)
const profile = computed<ElevationProfileResponse>(() => {
    if (!props.profileResponse) {
        return
    }
    return isReverse.value ? reverseProfile(props.profileResponse) : props.profileResponse
})

function reverseProfile(profile: ElevationProfileResponse): ElevationProfileResponse {
    const totalDist = profile.points.at(-1)?.dist ?? 0
    const points = [...profile.points]
        .reverse()
        .map((point) => ({ ...point, dist: totalDist - point.dist }))
        .sort((a, b) => a.dist - b.dist)
    return {
        ...profile,
        metadata: {
            ...profile.metadata,
            elevationDifference: -profile.metadata.elevationDifference,
            totalAscent: profile.metadata.totalDescent,
            totalDescent: profile.metadata.totalAscent,
        },
        points,
    }
}

function triggerDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = props.filename.endsWith('.csv') ? props.filename : `${props.filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

function exportCSV(profile: ElevationProfileResponse): void {
    const csvData =
        [
            ['Distance', 'Altitude', 'Easting', 'Northing', 'Longitude', 'Latitude'],
            ...profile.points.map((point) => {
                const [lon, lat] = proj4(LV95.epsg, WGS84.epsg, point.coordinate)
                const [x, y] = [point.coordinate[0], point.coordinate[1]]
                return [
                    point.dist,
                    point.elevation,
                    LV95.roundCoordinateValue(x),
                    LV95.roundCoordinateValue(y),
                    WGS84.roundCoordinateValue(lon),
                    WGS84.roundCoordinateValue(lat),
                ]
            }),
        ]
            .map((row) => row.join(';'))
            .join('\n') + '\n'
    triggerDownload(new Blob([csvData], { type: 'text/csv' }))
}
</script>

<template>
    <div class="flex w-full flex-col items-center justify-center">
        <ElevationProfilePlot
            v-if="profileResponse"
            :profile="profile"
            :labels="labels.plot"
        >
            <slot />
        </ElevationProfilePlot>
        <ElevationProfileMetadata
            v-if="profileResponse"
            :metadata="profile.metadata"
            :labels="labels.metadata"
        >
            <UButton
                icon="i-lucide-arrow-left-right"
                size="md"
                color="primary"
                variant="solid"
                @click="isReverse = !isReverse"
            />
            <UButton
                icon="i-lucide-download"
                size="md"
                color="primary"
                variant="solid"
                @click="exportCSV(profile)"
            />
        </ElevationProfileMetadata>
    </div>
</template>

<style scoped></style>
