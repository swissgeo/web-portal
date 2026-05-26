<script setup lang="ts">
/**
 * Container component that renders geolocation visual feedback on the OpenLayers map
 * (accuracy circle + position marker) and disables tracking when the user drags the map.
 */
import type { Map } from "ol";
import type { Ref } from "vue";

import log from "@swissgeo/log";
import { usePositionStore } from "@swissgeo/map";
import { inject, onBeforeMount, onBeforeUnmount } from "vue";

import { useGeolocationStore } from "@/stores/geolocation";

import OpenLayersAccuracyCircle from "./OpenLayersAccuracyCircle.vue";
import OpenLayersPositionMarker from "./OpenLayersPositionMarker.vue";

const dispatcher = { name: "OpenLayersGeolocationFeedback.vue" };

const olMap = inject<Ref<Map | undefined>>("olMap");
if (!olMap) {
  log.error("OpenLayersGeolocationFeedback: olMap not provided");
}

const geolocationStore = useGeolocationStore();
const positionStore = usePositionStore();

onBeforeMount(() => {
  olMap?.value?.on("pointerdrag", disableTrackingAndAutoRotation);
});

onBeforeUnmount(() => {
  olMap?.value?.un("pointerdrag", disableTrackingAndAutoRotation);
});

function disableTrackingAndAutoRotation(): void {
  if (geolocationStore.tracking) {
    log.debug("Map dragged — disabling geolocation tracking and auto-rotation");
    geolocationStore.setGeolocationTracking(false, dispatcher);
    positionStore.setAutoRotation(false, dispatcher);
  }
}
</script>

<template>
  <OpenLayersAccuracyCircle />
  <OpenLayersPositionMarker v-if="geolocationStore.position" />
</template>
