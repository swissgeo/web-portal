<script setup lang="ts">
import type { ElevationProfileMetadata } from '@swissgeo/api'
import type { SupportedLocales } from '@swissgeo/staging-config'

import { profileUtils } from '@swissgeo/api/utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { VueI18nTranslateFunction } from '../types/vue-i18n'

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
const { t }: { t: VueI18nTranslateFunction<ElevationProfileInformationMessages> } = useI18n<
    ElevationProfileInformationMessages,
    SupportedLocales
>()

const metadataEntries = computed(() => {
    return [
        {
            title: 'profile_elevation_difference',
            icons: ['i-lucide-arrows-up-down'],
            value: profileUtils.formatElevation(metadata.elevationDifference),
        },
        {
            title: 'profile_elevation_up',
            icons: ['i-lucide-arrow-up-wide-narrow'],
            value: profileUtils.formatElevation(metadata.totalAscent),
        },
        {
            title: 'profile_elevation_down',
            icons: ['i-lucide-arrow-down-wide-narrow'],
            value: profileUtils.formatElevation(metadata.totalDescent),
        },
        {
            title: 'profile_poi_up',
            icons: ['i-lucide-chevron-up'],
            value: profileUtils.formatElevation(metadata.maxElevation),
        },
        {
            title: 'profile_poi_down',
            icons: ['i-lucide-chevron-down'],
            value: profileUtils.formatElevation(metadata.minElevation),
        },
        {
            title: 'profile_distance',
            icons: ['i-lucide-globe', 'i-lucide-arrows-left-right'],
            value: profileUtils.formatDistance(metadata.totalLinearDist),
        },
        {
            title: 'profile_slope_distance',
            icons: ['i-lucide-mountain-snow', 'i-lucide-arrows-left-right'],
            value: profileUtils.formatDistance(metadata.slopeDistance),
        },
        {
            title: 'profile_hike_time',
            icons: ['i-lucide-clock'],
            value: profileUtils.formatMinutesTime(metadata.hikingTime),
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
                :text="t(data.title)"
            >
                <small
                    class="flex items-center gap-1 text-nowrap"
                    :class="{
                        'border-r-1 border-neutral-300 pe-2': index !== metadataEntries.length - 1,
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
