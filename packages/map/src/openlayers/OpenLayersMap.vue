<script lang="ts" setup>
import type { Map as OlMapType } from "ol";
import type { Ref } from "vue";

import { onMounted, provide, shallowRef, useTemplateRef } from "vue";

import type { MapLayerRenderer } from "@/types";
import type { Layer } from "@/types/layers";

import createOlMap from "@/composables/createOlMap";

import { useMapStore } from "../stores/map";
import OpenLayersVisibleLayer from "./OpenLayersVisibleLayer.vue";

const { layers, customLayerRenderers, zoomOnlyCtrl } = defineProps<{
  layers: Layer[];
  customLayerRenderers?: MapLayerRenderer[];
  zoomOnlyCtrl?: boolean;
}>();

const emit = defineEmits<{
  layerError: [uuid: string, error: unknown];
}>();

function emitLayerError(uuid: string, error: unknown) {
  emit("layerError", uuid, error);
}

const mapElement = useTemplateRef("mapElement");
const olMap = shallowRef<OlMapType>();
const mapStore = useMapStore();

provide<Ref<OlMapType | undefined>>("olMap", olMap);

onMounted(() => {
  mountOlMap();
  // make it available for debugging
  (window as Window & { swissgeoOlMap?: OlMapType }).swissgeoOlMap =
    olMap.value;
});

function initializeOlMap(zoomOnlyCtrl = false) {
  const { map } = createOlMap({ zoomOnlyCtrl });

  olMap.value = map;
  mapStore.setOlMap(map);

  map.once("loadend", () => {
    mapStore.setIsMapLoaded();
  });
}

function mountOlMap() {
  if (olMap.value && mapElement.value) {
    olMap.value.setTarget(mapElement.value);
  }
}

initializeOlMap(zoomOnlyCtrl);
</script>

<template>
  <div ref="mapElement" class="ol-map h-full w-full" data-testid="ol-map">
    <OpenLayersVisibleLayer
      :layer="layer"
      :custom-layer-renderers="customLayerRenderers"
      :key="layer.uuid"
      v-for="layer in layers"
      @layer-error="emitLayerError"
    />
  </div>
  <!-- So that external modules can have access to the map instance through the provided 'olMap' -->
  <slot />
</template>
