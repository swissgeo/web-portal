<script lang="ts" setup>
import type { MapLayerRenderer } from "@swissgeo/map";

import { OpenLayersDrawingLayer, isDrawingLayer } from "@swissgeo/drawing";
import { useLayerStore } from "@swissgeo/layers";
import { MapModule } from "@swissgeo/map";

import SourceToMapDataConverter from "../components/SourceToMapDataConverter.vue";

const geolocationStore = useGeolocationStore();
const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();

const { sources: attributionSources } = useAttributionSources(
  computed(() => layerStore.layers),
  computed(() => layerStore.backgroundLayer),
);

const sourceLayers = computed(() => layerStore.layers);

const backgroundLayer = computed(() => layerStore.backgroundLayer);

const layersForMap = computed(() => {
  return mapViewStore.getMapLayers().value;
});

const customLayerRenderers: MapLayerRenderer[] = [
  {
    matches: isDrawingLayer,
    component: OpenLayersDrawingLayer,
  },
];

// The display mode is defined in the layout
const displayMode = inject<"web" | "print" | "embedded">("displayMode", "web");
</script>

<template>
  <ClientOnly>
    <SourceToMapDataConverter
      :source-bg-layer="backgroundLayer"
      :source-data="sourceLayers"
    />
    <MapModule
      :layers="layersForMap"
      :custom-layer-renderers="customLayerRenderers"
      :display-mode="displayMode"
      class="h-full w-full"
    >
      <MapOpenLayersGeolocationFeedback
        v-if="geolocationStore.active && geolocationStore.position"
      />
      <MapAttributionList :sources="attributionSources" />
    </MapModule>
    <Toolbox />
  </ClientOnly>
</template>
