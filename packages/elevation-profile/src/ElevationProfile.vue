<script setup lang="ts">
import type { ElevationProfileResponse } from '@swissgeo/shared/api'

import ElevationProfileMetadata from './components/ElevationProfileMetadata.vue'
import ElevationProfilePlot from './components/ElevationProfilePlot.vue'

import type { Labels as PlotLabels } from './components/ElevationProfilePlot.vue'
import type { Labels as MetadataLabels } from './components/ElevationProfileMetadata.vue'

defineProps<{
    profileResponse?: ElevationProfileResponse
    isLoading: boolean
}>()

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
</script>

<template>
    <div class="flex w-full flex-col items-center justify-center">
        <ElevationProfilePlot
            v-if="profileResponse"
            :profile="profileResponse"
            :labels="labels.plot"
        >
            <slot />
        </ElevationProfilePlot>
        <ElevationProfileMetadata
            v-if="profileResponse"
            :metadata="profileResponse.metadata"
            :labels="labels.metadata"
        />
    </div>
</template>

<style scoped></style>
