<script setup lang="ts">
import type { Dimension } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { useSidebarStore } from "@swissgeo/skeleton";
import { TimeSlider } from "@swissgeo/timeslider";

const mapViewStore = useMapViewStore();
const layerStore = useLayerStore();
const sidebarStore = useSidebarStore();

export type LayerWithTime = MapLayer & { dimensions: { time: Dimension } };

const timeLayers = computed((): LayerWithTime[] =>
  mapViewStore.mapLayers.filter((layer: MapLayer) => isTimeLayer(layer)),
);

// TODO HERE: give a MAPLAYER and do some mixing to get dimensions from
function isTimeLayer(mapLayer: MapLayer): mapLayer is LayerWithTime {
  return !!layerStore.getLayer(mapLayer.uuid)?.dimensions?.time;
}

function onClose() {
  mapViewStore.closeTimeSlider();
}

function onUpdateDimension({
  uuid,
  key,
  dimension,
}: {
  uuid: string;
  key: string;
  dimension: Partial<Dimension>;
}) {
  layerStore.setDimension(key as "time", uuid, dimension);
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
      @update-dimension="onUpdateDimension"
      @update-visibility="onUpdateVisibility"
    />
  </div>
</template>
