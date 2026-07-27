<script setup lang="ts">
import { useDimensionsStore } from "@swissgeo/dimension";
import { useDrawing } from "@swissgeo/drawing";
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
import CompassButton from "@/components/toolbox/toolboxButtons/CompassButton.vue";
import FullScreenButton from "@/components/toolbox/toolboxButtons/FullScreenButton.vue";
import GeolocButton from "@/components/toolbox/toolboxButtons/GeolocButton.vue";
import RecenterButton from "@/components/toolbox/toolboxButtons/RecenterButton.vue";
import TimeSliderButton from "@/components/toolbox/toolboxButtons/TimeSliderButton.vue";
import Toggle3dButton from "@/components/toolbox/toolboxButtons/Toggle3dButton.vue";
import ZoomButtons from "@/components/toolbox/toolboxButtons/ZoomButtons.vue";
import { useGeolocationStore } from "@/stores/geolocation";

const { focusMode } = useDrawing();

const layerStore = useLayerStore();
const dimensionsStore = useDimensionsStore();
// const drawingStore = useDrawingStore();
const mapViewStore = useMapViewStore();
const geolocationStore = useGeolocationStore();

const showFullScreeButton = computed(() => focusMode.value === "none");
// Buttons related to the geolocation function
const showGelocationButton = ref(true);
const showRecenterButton = computed(
  () => geolocationStore.active && geolocationStore.position !== undefined,
);
const showCompassButton = ref(false);

const showZoomButtons = ref(true);
const show3dButton = ref(true);
const showTimeSliderButton = computed(() => {
  return layerStore.layers.some(
    (layer) => !!dimensionsStore.getDimensions(layer.uuid)?.time,
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
  <div class="absolute top-4 right-4" data-testid="toolbox-right">
    <UCard
      class="mb-4"
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <FullScreenButton v-if="isWebMode && showFullScreeButton" />
      <GeolocButton v-if="isWebMode && showGelocationButton" />
      <Toggle3dButton v-if="isWebMode && show3dButton" />
      <CompassButton v-if="isWebMode && showCompassButton" />
      <RecenterButton v-if="isWebMode && showRecenterButton" />
      <slot />
    </UCard>
    <UCard
      :ui="{
        body: 'flex flex-col items-center gap-2 p-1 sm:p-2',
      }"
    >
      <ZoomButtons v-if="isEmbedMode && showZoomButtons" />
      <TimeSliderButton v-if="isWebMode && showTimeSliderButton" />
      <CompareSliderButton v-if="isWebMode && showCompareSliderButton" />
    </UCard>
  </div>
</template>

<style scoped></style>
