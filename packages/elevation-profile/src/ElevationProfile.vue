<script setup lang="ts">
import type { ElevationProfileResponse } from '@swissgeo/shared/api'

import ElevationProfileMetadata from './components/ElevationProfileMetadata.vue'
import ElevationProfilePlot from './components/ElevationProfilePlot.vue'

defineProps<{
    profileResponse?: ElevationProfileResponse
    isLoading: boolean
}>()
</script>

<template>
    <div class="flex w-full flex-col items-center justify-center">
        <ElevationProfilePlot
            v-if="profileResponse"
            :profile="profileResponse"
        >
            <slot />
        </ElevationProfilePlot>
        <ElevationProfileMetadata
            v-if="profileResponse"
            :metadata="profileResponse.metadata"
        />
    </div>
</template>

<style scoped></style>
