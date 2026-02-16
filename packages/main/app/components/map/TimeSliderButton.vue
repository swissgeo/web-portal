<script setup lang="ts">
import { TimeSlider } from '@swissgeo/map'
import { useUiStore } from '@swissgeo/skeleton'

const uiStore = useUiStore()
</script>

<template>
    <div
        v-if="uiStore.isTimeSliderVisible"
        class="fixed top-4 left-[420px] right-24 z-50"
    >
        <!-- Time slider bar -->
        <TimeSlider />
    </div>
</template>
