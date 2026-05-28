<script setup lang="ts">
/**
 * Renders a semi-transparent circle on the map showing the accuracy radius of the current
 * geolocation position.
 */
import type { Map } from "ol";
import type Feature from "ol/Feature";
import type { Circle } from "ol/geom";
import type { Vector as VectorLayer } from "ol/layer";
import type { Vector as VectorSource } from "ol/source";
import type { Fill, Stroke, Style } from "ol/style";
import type { Ref } from "vue";

import { useAddLayerToMap } from "@swissgeo/map";
import { computed, inject, onMounted, shallowRef, watch } from "vue";

import { useGeolocationStore } from "@/stores/geolocation";

const { zIndex = 50 } = defineProps<{ zIndex?: number }>();

const geolocationStore = useGeolocationStore();
const position = computed(() => geolocationStore.position);
const accuracy = computed(() => geolocationStore.accuracy);

const olMap = inject<Ref<Map | undefined>>("olMap");

const accuracyCircle = new Circle(position.value ?? [0, 0], accuracy.value);
const accuracyFeature = new Feature({ geometry: accuracyCircle });
accuracyFeature.setStyle(
  new Style({
    fill: new Fill({ color: "rgba(255, 0, 0, 0.15)" }),
    stroke: new Stroke({ color: "rgba(255, 0, 0, 0.5)", width: 1 }),
  }),
);

const layer = shallowRef<VectorLayer>(
  new VectorLayer({
    source: new VectorSource({ features: [accuracyFeature] }),
  }),
);

const { addLayerToMap } = useAddLayerToMap(
  layer,
  computed(() => zIndex),
  computed(() => true),
  computed(() => 1),
  olMap,
);

onMounted(() => addLayerToMap());

watch(position, (newPosition) => {
  if (newPosition) {
    accuracyCircle.setCenter(newPosition);
  }
});

watch(accuracy, (newAccuracy) => {
  accuracyCircle.setRadius(newAccuracy);
});
</script>

<template>
  <slot />
</template>
