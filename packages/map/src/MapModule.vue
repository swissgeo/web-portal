<script lang="ts" setup>
import log, { LogLevel } from "@swissgeo/log";
import { computed } from "vue";

import type { MapLayerRenderer } from "@/types";
import type { Layer as MapLayer } from "@/types/layers";

import OpenLayersCompareSlider from "./openlayers/OpenLayersCompareSlider.vue";
import OpenLayersContextMenuPopup from "./openlayers/OpenLayersContextMenuPopup.vue";
import OpenLayersMap from "./openlayers/OpenLayersMap.vue";
import OpenLayersMouseTracker from "./openlayers/OpenLayersMouseTracker.vue";
import OpenLayersScale from "./openlayers/OpenLayersScale.vue";
import OpenLayersScalePrint from "./openlayers/OpenLayersScalePrint.vue";

log.wantedLevels = [
  LogLevel.Debug,
  LogLevel.Info,
  LogLevel.Warn,
  LogLevel.Error,
];

const {
  layers,
  customLayerRenderers,
  compareSliderActive = false,
  compareRatio = 0.5,
  compareSliderClippedLayer,
} = defineProps<{
  layers: MapLayer[];
  customLayerRenderers?: MapLayerRenderer[];
  displayMode: "web" | "print" | "embedded";
  /** Whether the compare slider is shown over the map (web mode only). */
  compareSliderActive?: boolean;
  /** Horizontal position of the compare slider, as a ratio of the map width. */
  compareRatio?: number;
  /** The layer the compare slider clips; nothing is shown without it. */
  compareSliderClippedLayer?: Pick<
    MapLayer,
    "layerId" | "uuid" | "displayName"
  >;
}>();

const emit = defineEmits<{
  "update:compareRatio": [ratio: number];
}>();

const layersWithZIndex = computed(() => {
  // openlayers require a Zindex param. We set it to the layer orders here
  const mapLayers = layers.map((mapLayer, index) => {
    mapLayer.zIndex = index;
    return mapLayer;
  });
  return mapLayers;
});
</script>

<template>
  <div>
    <!-- here's the switch between openlayers and cesium -->
    <OpenLayersMap
      :custom-layer-renderers="customLayerRenderers"
      :layers="layersWithZIndex"
    >
      <slot />

      <template v-if="displayMode === 'web'">
        <OpenLayersContextMenuPopup v-slot="slotProps">
          <slot name="context-menu-popup" v-bind="slotProps" />
        </OpenLayersContextMenuPopup>
        <OpenLayersMouseTracker />
        <OpenLayersScale />
        <OpenLayersCompareSlider
          v-if="compareSliderActive && compareSliderClippedLayer"
          :compare-ratio="compareRatio"
          :clipped-layer="compareSliderClippedLayer"
          @update:compare-ratio="emit('update:compareRatio', $event)"
        />
      </template>
      <template v-else-if="displayMode === 'print'">
        <OpenLayersScalePrint />
      </template>
      <template v-else-if="displayMode === 'embedded'">
        <OpenLayersScale />
      </template>
    </OpenLayersMap>
  </div>
</template>
