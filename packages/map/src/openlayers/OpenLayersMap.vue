<script lang="ts" setup>
import type { Map as OlMapType } from "ol";
import type { Ref } from "vue";

import { platformModifierKeyOnly } from "ol/events/condition.js";
import { defaults } from "ol/interaction/defaults.js";
import DragPan from "ol/interaction/DragPan.js";
import MouseWheelZoom from "ol/interaction/MouseWheelZoom.js";
import Map from "ol/Map";
import { onMounted, provide, shallowRef, useTemplateRef } from "vue";

import type { MapLayerRenderer } from "@/types";
import type { Layer } from "@/types/layers";

import useViewBasedOnProjection from "@/composables/useViewBasedOnProjection.composable";

import { useMapStore } from "../stores/map";
import OpenLayersVisibleLayer from "./OpenLayersVisibleLayer.vue";

const { layers, customLayerRenderers, zoomOnlyCtrl } = defineProps<{
  layers: Layer[];
  customLayerRenderers?: MapLayerRenderer[];
  zoomOnlyCtrl?: boolean;
}>();

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

function createOlMap(zoomOnlyCtrl = false) {
  const map = new Map({
    controls: [],
    ...(zoomOnlyCtrl
      ? {
          interactions: defaults({
            dragPan: false,
            mouseWheelZoom: false,
          }).extend([
            new DragPan({
              condition: function (event) {
                return (
                  (this as DragPan).getPointerCount() === 2 ||
                  platformModifierKeyOnly(event)
                );
              },
            }),
            new MouseWheelZoom({
              condition: platformModifierKeyOnly,
            }),
          ]),
        }
      : {}),
  });
  olMap.value = map;

  useViewBasedOnProjection(olMap.value);
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

createOlMap(zoomOnlyCtrl);
</script>

<template>
  <div ref="mapElement" class="ol-map h-full w-full" data-testid="ol-map">
    <OpenLayersVisibleLayer
      :layer="layer"
      :custom-layer-renderers="customLayerRenderers"
      :key="layer.uuid"
      v-for="layer in layers"
    />
  </div>
  <!-- So that external modules can have access to the map instance through the provided 'olMap' -->
  <slot />
</template>
