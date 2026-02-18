<script setup lang="ts">
import { LucideIcon } from '@swissgeo/skeleton'

const mapViewStore = useMapViewStore()
</script>

<template>
    <div>
        <button
            id="timeSliderButton"
            class="toolbox-button d-print-none mb-1 h-[40px] w-[40px] cursor-pointer rounded-[20px] text-white"
            :class="mapViewStore.isTimeSliderVisible ? 'bg-blue-600' : 'bg-black'"
            data-cy="time-slider-button"
            @click="mapViewStore.toggleTimeSlider()"
        >
            <LucideIcon
                name="TimerReset"
                class="h-[40px] w-[40px]"
            />
        </button>
    </div>
</template>

<style scoped></style>
