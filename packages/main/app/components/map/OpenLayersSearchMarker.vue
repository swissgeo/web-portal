<script setup lang="ts">
/**
 * Marks the location the user searched for with a balloon pin, the way
 * map.geo.admin.ch marks its pinned location. The crosshair it also knows is a
 * different feature there, driven by the `crosshair` URL parameter.
 */
import type { Map } from "ol";
import type { Ref } from "vue";

import { useAddLayerToMap } from "@swissgeo/map";
import { useSearchStore } from "@swissgeo/skeleton";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Icon, Style } from "ol/style";
import { computed, inject, onMounted, shallowRef, watch } from "vue";

const { zIndex = 53 } = defineProps<{ zIndex?: number }>();

const searchStore = useSearchStore();
const coordinate = computed(() => searchStore.pinnedCoordinate);

const olMap = inject<Ref<Map | undefined>>("olMap");

const balloonPin = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="38" viewBox="0 0 26 38">
  <path d="M13 2C7.5 2 3 6.5 3 12c0 6.5 10 24 10 24s10-17.5 10-24c0-5.5-4.5-10-10-10z" fill="#dc2626" stroke="#fff" stroke-width="2"/>
  <circle cx="13" cy="12" r="4" fill="#fff"/>
</svg>`;

const pointFeature = new Feature({
  geometry: new Point(coordinate.value ?? [0, 0]),
});
pointFeature.setStyle(
  new Style({
    image: new Icon({
      src: `data:image/svg+xml;utf8,${encodeURIComponent(balloonPin)}`,
      // the tip of the pin is what sits on the coordinate
      anchor: [0.5, 1],
    }),
  }),
);

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
