<script lang="ts" setup>
import type { MapLayerRenderer } from "@swissgeo/map";

import { OpenLayersDrawingLayer, isDrawingLayer } from "@swissgeo/drawing";
import { useLayerStore } from "@swissgeo/layers";
import { MapModule } from "@swissgeo/map";
import { LogoPic } from "@swissgeo/skeleton";

import SourceToMapDataConverter from "../components/SourceToMapDataConverter.vue";

const url = useRequestURL();
const { t } = useI18n();
const geolocationStore = useGeolocationStore();
const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();

const { sources: attributionSources } = useAttributionSources(
  computed(() => layerStore.layers),
  computed(() => layerStore.backgroundLayer),
);

const { stateQuery } = defineProps<{
  stateQuery?: string;
}>();

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
const displayMode = inject<"web" | "print" | "embed">("displayMode", "web");
</script>

<template>
  <ClientOnly>
    <UButton
      v-if="stateQuery"
      class="fixed top-4 left-4 z-9999"
      :to="`${url.origin}/map?state=${stateQuery}`"
      target="_blank"
      variant="solid"
      data-testid="embed-map-viewer-view-on-swissgeo-button"
    >
      <LogoPic class="h-auto w-auto!" :condensed="true" />
      {{ t("embed.viewOn", { platform: "swissgeo.ch" }) }}
    </UButton>
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
