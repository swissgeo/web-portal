<script setup lang="ts">
import type { ElevationProfileResponse } from '@swissgeo/shared/api'
import ElevationProfilePlot from './ElevationProfilePlot.vue'

defineProps<{
    profileResponse: ElevationProfileResponse | undefined
    isLoading: boolean
}>()
</script>

<template>
    <div>
        <ElevationProfilePlot
            v-if="profileResponse"
            :profile="profileResponse"
        />
    </div>
</template>

<style scoped></style>
