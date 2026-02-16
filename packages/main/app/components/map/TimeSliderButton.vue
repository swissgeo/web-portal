<script setup lang="ts">
import { TimeSlider } from '@swissgeo/map'
import { useUiStore } from '@swissgeo/skeleton'

const uiStore = useUiStore()
</script>

<template>
    <div
        v-if="uiStore.isTimeSliderVisible"
        class="fixed top-4 right-24 left-[420px] z-50"
    >
        <!-- Time slider bar -->
        <TimeSlider />
    </div>
</template>
