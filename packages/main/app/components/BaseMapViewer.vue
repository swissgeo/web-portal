<script lang="ts" setup>
import type { Layer as MapLayer, MapLayerRenderer } from "@swissgeo/map";
import type { DisplayMode } from "~/types/injectionKeys";

import { useLayerStore } from "@swissgeo/layers";
import { MapModule } from "@swissgeo/map";
import { cloneDeep } from "lodash";

import SourceToMapDataConverter from "../components/SourceToMapDataConverter.vue";

const {
  displayMode = "web",
  compareSliderActive,
  compareRatio,
  compareSliderClippedLayer,
  zoomOnlyCtrl = false,
} = defineProps<{
  displayMode?: DisplayMode;
  compareSliderActive?: boolean;
  compareRatio?: number;
  compareSliderClippedLayer?: Pick<
    MapLayer,
    "layerId" | "uuid" | "displayName"
  >;
  zoomOnlyCtrl?: boolean;
}>();

const emit = defineEmits<{
  "update:compareRatio": [ratio: number];
}>();

const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();

const sourceLayers = computed(() => layerStore.layers);
const backgroundLayer = computed(() => layerStore.backgroundLayer);
const layersForMap = computed(() => {
  const layers = mapViewStore.getMapLayers().value.map((layer) => {
    /**
     * We have a small issue. The conversion pipeline consume options, or sets the
     * default opacity to what the OGC records style tells us. If we try to set
     * the opacity to 1 there, we encounter situations where this opacity is set
     * before the default style is applied, and thus we couldn't be certain if the
     * opacity was due to previous options and should be kept, or to a default temporary
     * value and should be discarded.
     *
     * Now, this conversion pipeline do not set a "default" application value, and
     * instead it is done by this computed. We use a clone when there is a need to set the
     * opacity to avoid modifying the original layer, and we do not use clones otherwise to avoid
     * generating unnecessary objects (also, this was creating some flickering)
     *
     */
    if (!layer.opacity) {
      if (layer.layerUuid === backgroundLayer.value?.uuid) {
        layer.opacity = 1;
        return layer;
      }
      const clonedLayer = cloneDeep(layer);
      clonedLayer.opacity = 1;
      return clonedLayer;
    }
    return layer;
  });
  return layers;
});

const customLayerRenderers: MapLayerRenderer[] = [];
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
