<script setup lang="ts">
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

const mapViewStore = useMapViewStore()
</script>

<template>
    <div>
        <ToolBoxButton
            title="Time Slider toggle button"
            :is-disabled="false"
            :is-active="mapViewStore.isTimeSliderVisible"
            iconName="TimerReset"
            @click="mapViewStore.toggleTimeSlider()"
        />
    </div>
</template>

<style scoped></style>
