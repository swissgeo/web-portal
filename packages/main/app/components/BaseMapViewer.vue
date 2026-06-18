<script lang="ts" setup>
import type { Layer as MapLayer, MapLayerRenderer } from "@swissgeo/map";

import { OpenLayersDrawingLayer, isDrawingLayer } from "@swissgeo/drawing";
import { useLayerStore } from "@swissgeo/layers";
import { MapModule } from "@swissgeo/map";

import SourceToMapDataConverter from "../components/SourceToMapDataConverter.vue";

const {
  displayMode = "web",
  compareSliderActive,
  compareRatio,
  compareSliderClippedLayer,
} = defineProps<{
  displayMode?: "web" | "print" | "embed";
  compareSliderActive?: boolean;
  compareRatio?: number;
  compareSliderClippedLayer?: Pick<
    MapLayer,
    "layerId" | "uuid" | "displayName"
  >;
}>();

const { zoomOnlyCtrl } = useEmbedConfig();

const emit = defineEmits<{
  "update:compareRatio": [ratio: number];
}>();

const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();

const sourceLayers = computed(() => layerStore.layers);
const backgroundLayer = computed(() => layerStore.backgroundLayer);
const layersForMap = computed(() => mapViewStore.getMapLayers().value);

const customLayerRenderers: MapLayerRenderer[] = [
  {
    matches: isDrawingLayer,
    component: OpenLayersDrawingLayer,
  },
];
</script>

<template>
  <ClientOnly>
    <slot name="before" />
    <SourceToMapDataConverter
      :source-bg-layer="backgroundLayer"
      :source-data="sourceLayers"
    />
    <MapModule
      :layers="layersForMap"
      :custom-layer-renderers="customLayerRenderers"
      :display-mode="displayMode"
      :compare-slider-active="compareSliderActive"
      :compare-ratio="compareRatio"
      :compare-slider-clipped-layer="compareSliderClippedLayer"
      :zoom-only-ctrl="zoomOnlyCtrl"
      class="h-full w-full"
      @update:compare-ratio="emit('update:compareRatio', $event)"
    >
      <template
        v-if="$slots['context-menu-popup']"
        #context-menu-popup="slotProps"
      >
        <slot name="context-menu-popup" v-bind="slotProps" />
      </template>
      <slot name="map-ui" />
    </MapModule>
    <Toolbox v-if="displayMode !== 'print'" />
    <slot name="after" />
  </ClientOnly>
</template>
