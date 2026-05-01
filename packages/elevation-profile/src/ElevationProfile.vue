<script setup lang="ts">
import type { ElevationProfileResponse } from '@swissgeo/shared/api'

import { computed, ref } from 'vue'

import type { Labels as MetadataLabels } from './components/ElevationProfileMetadata.vue'
import type { Labels as PlotLabels } from './components/ElevationProfilePlot.vue'

import ElevationProfileMetadata from './components/ElevationProfileMetadata.vue'
import ElevationProfilePlot from './components/ElevationProfilePlot.vue'

const props = withDefaults(
    defineProps<{
        profileResponse: ElevationProfileResponse
        isLoading: boolean
        filename?: string
    }>(),
    {
        filename: 'export',
    }
)

const labels: {
    plot: PlotLabels
    metadata: MetadataLabels
} = {
    plot: {
        xAxis: 'Distance',
        yAxis: 'Elevation',
        noData: 'No elevation data available',
    },
    metadata: {
        elevationDifference: 'Difference of altitude start-end',
        elevationUp: 'Ascent',
        elevationDown: 'Descent',
        poiUp: 'Highest point',
        poiDown: 'Lowest point',
        distance: 'Linear distance',
        slopeDistance: 'Path distance',
    },
}

const isReverse = ref<boolean>(false)
const profile = computed<ElevationProfileResponse | undefined>(() => {
    if (!props.profileResponse) {
        return
    }
    return isReverse.value ? reverseProfile(props.profileResponse) : props.profileResponse
})

function reverseProfile(profile: ElevationProfileResponse): ElevationProfileResponse {
    const totalDist = profile.points.at(-1)?.dist ?? 0
    const points = [...profile.points].reverse().map((point) => ({
        ...point,
        dist: totalDist - point.dist,
    }))
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

function exportCSV(profile: ElevationProfileResponse): void {
    const csvContent =
        'data:text/csv;charset=utf-8,' +
        ['distance,elevation', ...profile.points.map((p) => `${p.dist},${p.elevation}`)].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${props.filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
