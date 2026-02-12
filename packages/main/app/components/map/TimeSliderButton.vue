<script setup lang="ts">
import { TimeSlider } from '@swissgeo/map'
import { IconButton } from '@swissgeo/skeleton'
import { ref } from 'vue'

const isTimeSliderActive = ref(false)

function toggleTimeSlider() {
    isTimeSliderActive.value = !isTimeSliderActive.value
}
</script>

<template>
    <div
        class="fixed top-4 left-16 z-50"
        :class="{ 'right-6': isTimeSliderActive }"
    >
        <!-- Toggle button -->
        <IconButton
            v-if="!isTimeSliderActive"
            id="timeSliderButton"
            data-test="time-slider-toggle-button"
            severity="primary"
            icon="Clock"
            @click="toggleTimeSlider"
        />

        <!-- Time slider bar -->
        <TimeSlider
            v-else
            @close="toggleTimeSlider"
        />
    </div>
</template>
