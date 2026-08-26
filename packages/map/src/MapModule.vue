<script lang="ts" setup>
import { computed } from "vue";

import type { MapLayerRenderer } from "@/types";
import type { Layer as MapLayer } from "@/types/layers";

import OpenLayersCompareSlider from "./openlayers/OpenLayersCompareSlider.vue";
import OpenLayersContextMenuPopup from "./openlayers/OpenLayersContextMenuPopup.vue";
import OpenLayersMap from "./openlayers/OpenLayersMap.vue";
import OpenLayersMouseTracker from "./openlayers/OpenLayersMouseTracker.vue";
import OpenLayersScale from "./openlayers/OpenLayersScale.vue";
import OpenLayersScalePrint from "./openlayers/OpenLayersScalePrint.vue";

const {
  layers,
  customLayerRenderers,
  compareSliderActive = false,
  compareRatio = 0.5,
  compareSliderClippedLayer,
  zoomOnlyCtrl = false,
} = defineProps<{
  layers: MapLayer[];
  customLayerRenderers?: MapLayerRenderer[];
  displayMode: "web" | "print" | "embed";
  /** Whether the compare slider is shown over the map (web mode only). */
  compareSliderActive?: boolean;
  /** Horizontal position of the compare slider, as a ratio of the map width. */
  compareRatio?: number;
  /** The layer the compare slider clips; nothing is shown without it. */
  compareSliderClippedLayer?: Pick<
    MapLayer,
    "layerId" | "uuid" | "displayName"
  >;
  /** Whether zoom interactions should only be active when Ctrl/Cmd key is pressed. */
  zoomOnlyCtrl?: boolean;
}>();

const emit = defineEmits<{
  layerError: [uuid: string, error: unknown];
  "update:compareRatio": [ratio: number];
}>();

function emitLayerError(uuid: string, error: unknown) {
  emit("layerError", uuid, error);
}

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
      :zoom-only-ctrl="zoomOnlyCtrl"
      @layer-error="emitLayerError"
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
      <template v-else-if="displayMode === 'embed'">
        <OpenLayersScale />
      </template>
    </OpenLayersMap>
  </div>
</template>
