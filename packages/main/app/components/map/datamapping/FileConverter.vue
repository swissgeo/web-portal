<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { LayerFormat, Layer as MapLayer } from "@swissgeo/map";

const { layer } = defineProps<{
  layer: Layer;
}>();

const emit = defineEmits<{
  update: [layer: MapLayer];
  remove: [void];
}>();

const layerData = computed((): MapLayer => {
  const base = {
    ...layer,
    // "geojson" is the only type whose LayerFormat isn't its uppercase form.
    format: (layer.type === "geojson"
      ? "GeoJSON"
      : layer.type.toUpperCase()) as LayerFormat,
    layerId: layer.humanId,
    displayName: layer.info?.displayName ?? layer.humanId,
    opacity: 1,
    isVisible: true,
  };
  // GeoJSON is rendered from a parsed FeatureCollection, whereas KML/KMZ/GPX
  // are consumed as raw string data.
  if (base.format === "GeoJSON") {
    return {
      ...base,
      geoJsonData: JSON.parse(layer.data as string),
    } as MapLayer;
  }
  return base;
});

watch(layerData, () => emit("update", layerData.value), {
  immediate: true,
});

onBeforeUnmount(() => {
  emit("remove");
});
</script>

<template><slot></slot></template>
