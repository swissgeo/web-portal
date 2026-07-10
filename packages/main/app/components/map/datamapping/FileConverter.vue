<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";

import { convertFileLayerToMapLayer } from "@/utils/convertFileLayerToMapLayer";

const { layer } = defineProps<{
  layer: Layer;
}>();

const emit = defineEmits<{
  update: [layer: MapLayer];
  remove: [void];
}>();

const layerData = computed((): MapLayer => {
  return convertFileLayerToMapLayer(layer);
});

watch(layerData, () => emit("update", layerData.value), {
  immediate: true,
});

watch(
  layerData,
  () => {
    if (layerData.value) {
      emit("update", layerData.value);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  emit("remove");
});
</script>

<template><slot></slot></template>
