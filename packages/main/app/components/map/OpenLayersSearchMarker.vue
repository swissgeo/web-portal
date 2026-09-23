<script setup lang="ts">
/**
 * Marks the location the user searched for with a balloon pin, the way
 * map.geo.admin.ch marks its pinned location.
 */
import type { Map } from "ol";
import type { Ref } from "vue";

import { useAddLayerToMap } from "@swissgeo/map";
import { useSearchStore } from "@swissgeo/skeleton";
import balloonPinUrl from "~/assets/images/balloon_pin.svg";
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

const pointFeature = new Feature({
  geometry: new Point(coordinate.value ?? [0, 0]),
});
pointFeature.setStyle(
  new Style({
    image: new Icon({
      src: balloonPinUrl,
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
