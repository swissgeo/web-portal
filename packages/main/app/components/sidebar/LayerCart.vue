<script lang="ts" setup>
import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import LayerCartEntry from "./LayerCartEntry.vue";
const layerStore = useLayerStore();
const { t } = useI18n();
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
  <section
    class="flex h-full min-w-0 flex-1 flex-col bg-default"
    aria-labelledby="layer-cart-title"
  >
    <header class="shrink-0 px-4 pt-4">
      <h2
        id="layer-cart-title"
        class="p-0! font-editorial text-[18px]/[27px]! font-semibold text-highlighted"
      >
        {{ t("menu.map") }}
      </h2>
      <USeparator class="mt-4" />
    </header>

    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5">
      <ul data-testid="layer-cart" class="flex min-w-0 flex-col gap-2">
        <LayerCartEntry
          v-for="(layer, index) in sortedLayers"
          :key="layer.uuid"
          :layerIndex="mapLayers.value.length - 1 - index"
          :layer="layer"
        />
      </ul>
    </div>
  </section>
</template>
