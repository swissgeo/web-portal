<script setup lang="ts">
import type { ElevationProfileResponse } from '@swissgeo/shared/api'
import ElevationProfilePlot from './ElevationProfilePlot.vue'

const { profileResponse, isLoading } = defineProps<{
    profileResponse?: ElevationProfileResponse
    isLoading: boolean
}>()
</script>

<template>
    <div>
        <div
            v-if="isLoading"
            class="flex h-48 items-center justify-center"
        >
            Loading...
        </div>
        <ElevationProfilePlot
            v-else-if="profileResponse"
            :profile="profileResponse"
        />
    </div>
</template>

<style scoped></style>
