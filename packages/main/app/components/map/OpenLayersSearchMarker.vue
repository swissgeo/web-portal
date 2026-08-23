<script setup lang="ts">
/**
 * Renders a crosshair on the map at the coordinate the user searched for, the way
 * map.geo.admin.ch marks a searched coordinate.
 */
import type { Map } from "ol";
import type { Ref } from "vue";

import { useAddLayerToMap } from "@swissgeo/map";
import { useSearchStore } from "@swissgeo/skeleton";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Fill, RegularShape, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { computed, inject, onMounted, shallowRef, watch } from "vue";

const { zIndex = 53 } = defineProps<{ zIndex?: number }>();

const searchStore = useSearchStore();
const coordinate = computed(() => searchStore.pinnedCoordinate);

const olMap = inject<Ref<Map | undefined>>("olMap");

const stroke = new Stroke({ color: "#dc2626", width: 2 });

const pointFeature = new Feature({
  geometry: new Point(coordinate.value ?? [0, 0]),
});
pointFeature.setStyle([
  new Style({
    image: new CircleStyle({
      radius: 7,
      stroke,
      fill: new Fill({ color: "rgba(255, 255, 255, 0.4)" }),
    }),
  }),
  new Style({
    // a four branches star with no inner radius, which draws a crosshair
    image: new RegularShape({ points: 4, radius: 14, radius2: 0, stroke }),
  }),
]);

const layer = shallowRef<VectorLayer>(
  new VectorLayer({
    source: new VectorSource({ features: [pointFeature] }),
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

watch(coordinate, (newCoordinate) => {
  if (newCoordinate) {
    (pointFeature.getGeometry() as Point).setCoordinates(newCoordinate);
  }
});
</script>

<template>
  <slot />
</template>
