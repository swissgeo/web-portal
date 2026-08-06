<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { useSortable } from "@vueuse/integrations/useSortable";
import { computed, useTemplateRef } from "vue";

import LayerCartEntry from "./LayerCartEntry.vue";
const layerStore = useLayerStore();
const mapViewStore = useMapViewStore();
const { mapLayers } = defineProps<{
  mapLayers: Ref<MapLayer[]>;
}>();

// The store keeps the layers bottom-to-top, the panel shows them top-to-bottom,
// so each entry carries the index it has in the store
const sortedLayers = computed(() => {
  const entries = mapLayers.value
    .map((layer, layerIndex) => ({ layer, layerIndex }))
    .reverse();
  if (layerStore.backgroundLayer) {
    entries.pop();
  }

  return entries;
});

const layerCartRef = useTemplateRef<HTMLUListElement>("layerCartRef");

// The list is reordered through the store, not by letting Sortable mutate
// sortedLayers directly (it is a computed, and its display order does not map
// 1:1 to the store's), so the default onUpdate is replaced entirely.
useSortable(layerCartRef, sortedLayers, {
  handle: ".layer-reorder-handle",
  animation: 150,
  ghostClass: "opacity-40",
  onUpdate({ oldIndex, newIndex }) {
    if (oldIndex === undefined || newIndex === undefined) {
      return;
    }

    const draggedLayer = sortedLayers.value[oldIndex]?.layer;
    const targetLayerIndex = sortedLayers.value[newIndex]?.layerIndex;
    if (draggedLayer && targetLayerIndex !== undefined) {
      mapViewStore.setLayerIndex(draggedLayer.uuid, targetLayerIndex);
    }
  },
});
</script>

<template>
  <ul
    ref="layerCartRef"
    data-testid="layer-cart"
    class="mt-8 flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-2"
  >
    <LayerCartEntry
      v-for="{ layer, layerIndex } in sortedLayers"
      :key="layer.uuid"
      :layerIndex="layerIndex"
      :layer="layer"
    />
  </ul>
</template>
