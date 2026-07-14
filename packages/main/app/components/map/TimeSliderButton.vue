<script setup lang="ts">
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dimension } from "@swissgeo/timeslider";

import { useSidebarStore } from "@swissgeo/skeleton";
import { TimeSlider, useDimensionsStore } from "@swissgeo/timeslider";

const mapViewStore = useMapViewStore();
const dimensionsStore = useDimensionsStore();
const sidebarStore = useSidebarStore();

export type LayerWithTime = MapLayer & { dimensions: { time: Dimension } };

const timeLayers = computed((): LayerWithTime[] =>
  mapViewStore.mapLayers.filter((layer: MapLayer) => isTimeLayer(layer)),
);

function isTimeLayer(mapLayer: MapLayer): mapLayer is LayerWithTime {
  return !!dimensionsStore.getDimensions(mapLayer.uuid)?.time;
}

function onClose() {
  mapViewStore.closeTimeSlider();
}

function onUpdateTimeDimension({
  uuid,
  dimension,
}: {
  uuid: string;
  dimension: Partial<Dimension>;
}) {
  dimensionsStore.setDimension(uuid, "time", dimension);
}

function onUpdateVisibility({
  uuid,
  isVisible,
}: {
  uuid: string;
  isVisible: boolean;
}) {
  mapViewStore.setVisibility(uuid, isVisible);
}
</script>

<template>
  <div
    v-if="mapViewStore.isTimeSliderVisible"
    class="fixed top-4 right-24 z-50"
    :style="{ left: sidebarStore.sidebarWidth + 8 + 'px' }"
  >
    <TimeSlider
      :layers="timeLayers"
      @close="onClose"
      @update-dimension="onUpdateTimeDimension"
      @update-visibility="onUpdateVisibility"
    />
  </div>
</template>
