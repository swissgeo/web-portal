<script setup lang="ts">
import { TimeSlider } from '@swissgeo/map'
import { useUiStore } from '@swissgeo/skeleton'

const uiStore = useUiStore()

function handleClose() {
    uiStore.closeTimeSlider()
}
</script>

<template>
    <div
        v-if="uiStore.isTimeSliderVisible"
        class="fixed top-4 left-16 right-6 z-50"
    >
        <!-- Time slider bar -->
        <TimeSlider @close="handleClose" />
    </div>
</template>
