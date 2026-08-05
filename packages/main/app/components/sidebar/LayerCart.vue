<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { computed, ref } from "vue";

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

const draggedIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);

function isDropTarget(layerIndex: number) {
  return (
    draggedIndex.value !== null &&
    dropTargetIndex.value === layerIndex &&
    draggedIndex.value !== layerIndex
  );
}

function onDrop(layerIndex: number) {
  if (draggedIndex.value !== null) {
    mapViewStore.setLayerIndex(draggedIndex.value, layerIndex);
  }
  onDragEnd();
}

function onDragEnd() {
  draggedIndex.value = null;
  dropTargetIndex.value = null;
}
</script>

<template>
  <ul
    data-testid="layer-cart"
    class="mt-8 flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-2"
  >
    <LayerCartEntry
      v-for="{ layer, layerIndex } in sortedLayers"
      :key="layer.uuid"
      :layerIndex="layerIndex"
      :layer="layer"
      :isDragged="draggedIndex === layerIndex"
      :isDropTarget="isDropTarget(layerIndex)"
      @dragStart="draggedIndex = $event"
      @dragOver="dropTargetIndex = $event"
      @drop="onDrop"
      @dragEnd="onDragEnd"
    />
  </ul>
</template>
