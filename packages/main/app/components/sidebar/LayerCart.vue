<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { computed, ref } from "vue";

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

const mapViewStore = useMapViewStore();
const draggedIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);

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
      v-for="(layer, index) in sortedLayers"
      :key="layer.uuid"
      :layerIndex="mapLayers.value.length - 1 - index"
      :layer="layer"
      :isDragged="draggedIndex === mapLayers.value.length - 1 - index"
      :isDropTarget="
        draggedIndex !== null &&
        dropTargetIndex === mapLayers.value.length - 1 - index &&
        dropTargetIndex !== draggedIndex
      "
      @dragStart="draggedIndex = $event"
      @dragOver="dropTargetIndex = $event"
      @drop="onDrop"
      @dragEnd="onDragEnd"
    />
  </ul>
</template>
