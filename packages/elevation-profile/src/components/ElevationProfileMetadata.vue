<script setup lang="ts">
import type { ElevationProfileMetadata } from '@swissgeo/shared/api'

import { computed } from 'vue'
import { formatDistance, formatElevation } from '../utils'
interface ElevationProfileInformationProps {
    metadata: ElevationProfileMetadata
}

const { metadata } = defineProps<ElevationProfileInformationProps>()

interface ElevationProfileInformationMessages {
    profile_distance: string
    profile_elevation_difference: string
    profile_elevation_down: string
    profile_elevation_up: string
    profile_hike_time: string
    profile_poi_down: string
    profile_poi_up: string
    profile_slope_distance: string
}

const metadataEntries = computed(() => {
    return [
        {
            title: 'profile_elevation_difference',
            icons: ['i-lucide-arrow-down-up'],
            value: formatElevation(metadata.elevationDifference),
        },
        {
            title: 'profile_elevation_up',
            icons: ['i-lucide-arrow-up-wide-narrow'],
            value: formatElevation(metadata.totalAscent),
        },
        {
            title: 'profile_elevation_down',
            icons: ['i-lucide-arrow-down-wide-narrow'],
            value: formatElevation(metadata.totalDescent),
        },
        {
            title: 'profile_poi_up',
            icons: ['i-lucide-chevron-up'],
            value: formatElevation(metadata.maxElevation),
        },
        {
            title: 'profile_poi_down',
            icons: ['i-lucide-chevron-down'],
            value: formatElevation(metadata.minElevation),
        },
        {
            title: 'profile_distance',
            icons: ['i-lucide-globe', 'i-lucide-arrows-left-right'],
            value: formatDistance(metadata.totalLinearDist),
        },
        {
            title: 'profile_slope_distance',
            icons: ['i-lucide-mountain-snow', 'i-lucide-arrows-left-right'],
            value: formatDistance(metadata.slopeDistance),
        },
    ]
})
</script>

<template>
    <div class="flex gap-1 p-1">
        <div
            v-if="metadata.hasElevationData"
            class="flex gap-2 overflow-x-auto rounded border border-neutral-300 p-1 py-2 md:p-2 md:py-3"
            data-cy="profile-popup-info-container"
        >
            <UTooltip
                v-for="(data, index) in metadataEntries"
                :key="data.title"
                :text="data.title"
            >
                <small
                    class="flex items-center gap-1 text-nowrap"
                    :class="{
                        'border-r border-neutral-300 pe-2': index !== metadataEntries.length - 1,
                    }"
                    :data-cy="`profile-popup-info-${data.title}`"
                >
                    <UIcon
                        v-for="(icon, indexIcon) in data.icons"
                        :key="`${data.title}-${indexIcon}`"
                        :name="icon"
                    />
                    <span data-cy="profile-popup-info">
                        {{ data.value }}
                    </span>
                </small>
            </UTooltip>
        </div>
        <div class="flex gap-1">
            <slot />
        </div>
    </div>
</template>
