<script setup lang="ts">
/**
 * Marks the location the user searched for, the way map.geo.admin.ch does: a
 * crosshair for a typed coordinate, a balloon pin for a place or a feature.
 */
import type { Map } from "ol";
import type { Ref } from "vue";

import { useAddLayerToMap } from "@swissgeo/map";
import { useSearchStore } from "@swissgeo/skeleton";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Fill, Icon, RegularShape, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { computed, inject, onMounted, shallowRef, watchEffect } from "vue";

const { zIndex = 53 } = defineProps<{ zIndex?: number }>();

const searchStore = useSearchStore();
const coordinate = computed(() => searchStore.pinnedCoordinate);

const olMap = inject<Ref<Map | undefined>>("olMap");

const red = "#dc2626";
const stroke = new Stroke({ color: red, width: 2 });

const crosshair = [
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
];

const balloonPin = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="38" viewBox="0 0 26 38">
  <path d="M13 2C7.5 2 3 6.5 3 12c0 6.5 10 24 10 24s10-17.5 10-24c0-5.5-4.5-10-10-10z" fill="${red}" stroke="#fff" stroke-width="2"/>
  <circle cx="13" cy="12" r="4" fill="#fff"/>
</svg>`;

const balloon = new Style({
  image: new Icon({
    src: `data:image/svg+xml;utf8,${encodeURIComponent(balloonPin)}`,
    // the tip of the pin is what sits on the coordinate
    anchor: [0.5, 1],
  }),
});

const pointFeature = new Feature({
  geometry: new Point(coordinate.value ?? [0, 0]),
});

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

watchEffect(() => {
  if (coordinate.value) {
    (pointFeature.getGeometry() as Point).setCoordinates(coordinate.value);
  }
  pointFeature.setStyle(
    searchStore.pinnedMarkerType === "balloon" ? balloon : crosshair,
  );
});
</script>

<template>
  <slot />
</template>
