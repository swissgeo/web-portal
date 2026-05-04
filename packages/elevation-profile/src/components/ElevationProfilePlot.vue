<script setup lang="ts">
import type { ElevationProfileResponse, ElevationProfilePoint } from '@swissgeo/shared/api'
import type { ChartComponentRef } from 'vue-chartjs'

import { provide, useTemplateRef } from 'vue'
import { Line as LineChart } from 'vue-chartjs'

import { useElevationProfileChart } from '@/composables/useElevationProfileChart'

export type ScreenPoint = ElevationProfilePoint & {
    screenPosition: [number, number]
}

export type GetPointBeingHoveredFunction = () => ScreenPoint | undefined

export interface Labels {
    xAxis: string
    yAxis: string
    noData: string
}

const props = defineProps<{
    profile: ElevationProfileResponse
    labels: Labels
}>()

const profileChartContainerRef = useTemplateRef<HTMLDivElement>('profileChartContainer')
const profileTooltipRef = useTemplateRef<HTMLDivElement>('profileTooltip')
const chartRef = useTemplateRef<ChartComponentRef>('chart')

const {
    pointBeingHovered,
    unitUsedOnDistanceAxis,
    chartJsData,
    chartJsOptions,
    startPositionTracking,
    stopPositionTracking,
    clearHoverPosition,
    resetZoomToBaseValue,
    tooltipStyle,
} = useElevationProfileChart(
    () => props.profile,
    chartRef,
    profileChartContainerRef,
    profileTooltipRef,
    () => props.labels
)

provide<GetPointBeingHoveredFunction>('getPointBeingHovered', () => pointBeingHovered.value)
</script>

<template>
    <div
        ref="profileChartContainer"
        class="min-h-100px flex w-full grow overflow-hidden p-2"
        @mouseenter="startPositionTracking"
        @mouseleave="stopPositionTracking"
    >
        <LineChart
            v-if="chartJsOptions"
            ref="chart"
            :data="chartJsData"
            :options="chartJsOptions"
            class="min-w-full"
            data-cy="profile-graph"
            @mouseleave="clearHoverPosition"
            @contextmenu.prevent="resetZoomToBaseValue"
        />
    </div>
    <div
        ref="profileTooltip"
        class="fixed rounded border bg-white px-2 py-1"
        :style="tooltipStyle"
        data-cy="profile-popup-tooltip"
    >
        <div
            v-if="pointBeingHovered && pointBeingHovered.hasElevationData"
            class="m-auto p-1"
        >
            <div>
                <small>
                    <strong>{{ labels.xAxis }}: </strong>
                    <span data-cy="profile-popup-tooltip-distance">
                        {{ pointBeingHovered.dist }} {{ unitUsedOnDistanceAxis }}
                    </span>
                </small>
            </div>
            <div>
                <small>
                    <strong>{{ labels.yAxis }}: </strong>
                    <span
                        v-if="pointBeingHovered.elevation !== null"
                        data-cy="profile-popup-tooltip-elevation"
                    >
                        {{ pointBeingHovered.elevation }} m
                    </span>
                    <span v-else>
                        {{ labels.noData }}
                    </span>
                </small>
            </div>
        </div>
        <slot />
    </div>
</template>
