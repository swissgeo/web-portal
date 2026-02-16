<script setup lang="ts">
import { LucideIcon, useUiStore } from '@swissgeo/skeleton'

const uiStore = useUiStore()

function toggleTimeSlider(): void {
    uiStore.toggleTimeSlider()
}
</script>

<template>
    <div id="timeslider-button">
        <button
            class="toolbox-button d-print-none mb-1 h-[40px] w-[40px] rounded-[20px] text-white"
            :class="uiStore.isTimeSliderVisible ? 'bg-blue-600' : 'bg-black'"
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
