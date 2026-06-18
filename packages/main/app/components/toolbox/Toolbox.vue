<script setup lang="ts">
// import { useDrawingStore } from "@swissgeo/drawing";
/**
 * The Toolbox contains buttons to be used on the map. It is responsible for deciding which buttons
 * should show up and which shouldn't.
 *
 * 05.02.2026 ; for now, for each button, this is a "static" ref value, but when we implement the
 * logic behind the available buttons, it should become a computed value instead.
 */
import { useLayerStore } from "@swissgeo/layers";
import { displayModeKey } from "~/types/injectionKeys";
import { inject } from "vue";

import CompareSliderButton from "@/components/toolbox/toolboxButtons/CompareSliderButton.vue";
// import FullScreenButton from "@/components/toolbox/toolboxButtons/FullScreenButton.vue";
import GeolocButton from "@/components/toolbox/toolboxButtons/GeolocButton.vue";
import RecenterButton from "@/components/toolbox/toolboxButtons/RecenterButton.vue";
import TimeSliderButton from "@/components/toolbox/toolboxButtons/TimeSliderButton.vue";
import Toggle3dButton from "@/components/toolbox/toolboxButtons/Toggle3dButton.vue";
import ZoomButtons from "@/components/toolbox/toolboxButtons/ZoomButtons.vue";
import { useGeolocationStore } from "@/stores/geolocation";

import CompassButton from "./toolboxButtons/CompassButton.vue";

const layerStore = useLayerStore();
// const drawingStore = useDrawingStore();
const mapViewStore = useMapViewStore();
const geolocationStore = useGeolocationStore();

// const showFullScreeButton = computed(() => !drawingStore.isDrawing);
// Buttons related to the geolocation function
const showGelocationButton = ref(true);
const showRecenterButton = computed(
  () => geolocationStore.active && geolocationStore.position !== undefined,
);
const showCompassButton = ref(true);

const showZoomButtons = ref(true);
const show3dButton = ref(true);
const showTimeSliderButton = computed(() => {
  return layerStore.layers.some(
    (layer) => layer.dimensions && "time" in layer.dimensions,
  );
});

watch(showTimeSliderButton, (hasTimeLayers) => {
  if (!hasTimeLayers) {
    mapViewStore.closeTimeSlider();
  }
});

// the slider needs at least one visible overlay to compare against
const showCompareSliderButton = computed(
  () => mapViewStore.visibleLayers.length > 0,
);
const displayMode = inject(displayModeKey, "web");

const isWebMode = computed(() => displayMode === "web");
const isEmbedMode = computed(() => displayMode === "embed");
</script>

<template>
  <div
    class="toolbox-right absolute top-[1rem] right-[1rem] w-[40px] space-y-1"
    data-testid="toolbox-right"
  >
    <!-- <FullScreenButton v-if="isWebMode && showFullScreeButton" /> -->
    <GeolocButton v-if="isWebMode && showGelocationButton" />
    <CompassButton v-if="isWebMode && showCompassButton" />
    <RecenterButton v-if="isWebMode && showRecenterButton" />
    <ZoomButtons v-if="(isWebMode || isEmbedMode) && showZoomButtons" />
    <Toggle3dButton v-if="isWebMode && show3dButton" />
    <TimeSliderButton v-if="isWebMode && showTimeSliderButton" />
    <CompareSliderButton v-if="isWebMode && showCompareSliderButton" />
    <slot />
  </div>
</template>

<style scoped></style>
