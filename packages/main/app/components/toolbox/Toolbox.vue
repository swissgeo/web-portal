<script setup lang="ts">
/**
 * The Toolbox contains buttons to be used on the map. It is responsible for deciding which buttons
 * should show up and which shouldn't.
 *
 * 05.02.2026 ; for now, for each button, this is a "static" ref value, but when we implement the
 * logic behind the available buttons, it should become a computed value instead.
 */
import FullScreenButton from '@/components/toolbox/toolboxButtons/FullScreenButton.vue'
import GeolocButton from '@/components/toolbox/toolboxButtons/GeolocButton.vue'
import RecenterButton from '@/components/toolbox/toolboxButtons/RecenterButton.vue'
import TimeSliderButton from '@/components/toolbox/toolboxButtons/TimeSliderButton.vue'
import Toggle3dButton from '@/components/toolbox/toolboxButtons/Toggle3dButton.vue'
import ZoomButtons from '@/components/toolbox/toolboxButtons/ZoomButtons.vue'

import CompassButton from './toolboxButtons/CompassButton.vue'

const showFullScreeButton = ref(true)

// Buttons related to the geolocation function
const showGelocationButton = ref(true)
const showRecenterButton = ref(true)
const showCompassButton = ref(true)

const showZoomButtons = ref(true)
const show3dButton = ref(true)
const showTimeSliderButton = ref(true)
</script>

<template>
    <div
        class="toolbox-right absolute top-[1rem] right-[1rem] w-[40px] space-y-1"
        data-cy="toolbox-right"
    >
        <FullScreenButton v-if="showFullScreeButton" />
        <GeolocButton v-if="showGelocationButton" />
        <CompassButton v-if="showCompassButton" />
        <RecenterButton v-if="showRecenterButton" />
        <ZoomButtons v-if="showZoomButtons" />
        <Toggle3dButton v-if="show3dButton" />
        <TimeSliderButton v-if="showTimeSliderButton" />
        <slot />
    </div>
</template>

<style scoped></style>
