<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { useSortable } from "@vueuse/integrations/useSortable";
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import LayerCartEntry from "./LayerCartEntry.vue";
import LayerCatalog from "./LayerCatalog.vue";
const { t } = useI18n();
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

// Placeholder until there is a catalog to pick layers from
const isAddLayerOpen = ref(false);

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
  <div
    class="flex min-h-14 items-center justify-between gap-2 border-b border-gray-200 px-4"
  >
    <!-- h2 carries global heading styles (see main.css), which do not fit a
         panel header, hence the h3 -->
    <h3 class="text-sm font-bold text-gray-900">{{ t("menu.map") }}</h3>
    <UButton
      data-testid="add-layer"
      icon="i-lucide-plus"
      color="primary"
      size="sm"
      class="cursor-pointer rounded-full"
      @click="isAddLayerOpen = true"
    >
      {{ t("menu.addLayer") }}
    </UButton>
  </div>

  <UModal v-model:open="isAddLayerOpen" :title="t('menu.addLayer')">
    <template #body>
      <LayerCatalog />
    </template>
  </UModal>

  <ul
    ref="layerCartRef"
    data-testid="layer-cart"
    class="mt-4 flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-2"
  >
    <LayerCartEntry
      v-for="{ layer, layerIndex } in sortedLayers"
      :key="layer.uuid"
      :layerIndex="layerIndex"
      :layer="layer"
    />
  </ul>
</template>
