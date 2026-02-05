<script setup lang="ts">
import { LucideIcon } from '@swissgeo/skeleton'

function isDisabled(): boolean {
    return true
}

function toggleTimeSlider(): void {
    throw new Error('TIME SLIDER BUTTON IS NOT YET IMPLEMENTED')
}
</script>

<template>
    <div id="timeslider-button">
        <button
            class="toolbox-button d-print-none mb-1 h-[40px] w-[40px] rounded-[20px] bg-gray-500 text-white"
            :disabled="isDisabled()"
            data-cy="time-slider-button"
            @click="toggleTimeSlider()"
        >
            <LucideIcon
                name="TimerReset"
                class="h-[40px] w-[40px]"
            />
        </button>
    </div>
</template>

<style scoped></style>
