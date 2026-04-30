<script setup lang="ts">
import type { ElevationProfileMetadata } from '@swissgeo/shared/api'

import { computed } from 'vue'
import { formatDistance, formatElevation } from '../utils'

export interface Labels {
    elevationDifference: string
    elevationUp: string
    elevationDown: string
    poiUp: string
    poiDown: string
    distance: string
    slopeDistance: string
}

const { metadata, labels } = defineProps<{ metadata: ElevationProfileMetadata; labels: Labels }>()

const metadataEntries = computed(() => {
    return [
        {
            title: labels.elevationDifference,
            icons: ['i-lucide-arrow-down-up'],
            value: formatElevation(metadata.elevationDifference),
        },
        {
            title: labels.elevationUp,
            icons: ['i-lucide-arrow-up-wide-narrow'],
            value: formatElevation(metadata.totalAscent),
        },
        {
            title: labels.elevationDown,
            icons: ['i-lucide-arrow-down-wide-narrow'],
            value: formatElevation(metadata.totalDescent),
        },
        {
            title: labels.poiUp,
            icons: ['i-lucide-chevron-up'],
            value: formatElevation(metadata.maxElevation),
        },
        {
            title: labels.poiDown,
            icons: ['i-lucide-chevron-down'],
            value: formatElevation(metadata.minElevation),
        },
        {
            title: labels.distance,
            icons: ['i-lucide-globe', 'i-lucide-arrows-left-right'],
            value: formatDistance(metadata.totalLinearDist),
        },
        {
            title: labels.slopeDistance,
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
