<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { computed } from "vue";

import LayerCartEntry from "./LayerCartEntry.vue";
const layerStore = useLayerStore();
const { mapLayers } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
}>();

// slice() creates a copy, which allows us to avoid mutating the original
const sortedLayers = computed(() => {
  const sortedLayers = mapLayers.value.slice().reverse();
  if (layerStore.backgroundLayer) {
    sortedLayers.splice(sortedLayers.length - 1, 1);
  }

  return sortedLayers;
});
</script>

<template>
  <ul class="mt-8 flex flex-col gap-4">
    <LayerCartEntry
      v-for="(layer, index) in sortedLayers"
      class="flex items-center gap-2"
      :key="layer.uuid"
      :layerIndex="mapLayers.value.length - 1 - index"
      :layer="layer"
    />
  </ul>
</template>
