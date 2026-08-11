<script setup lang="ts">
import type { Layer } from "@swissgeo/layers";
import type { LayerFormat, Layer as MapLayer } from "@swissgeo/map";

import log from "@swissgeo/log";
import { parseGeoJson } from "~/utils/geoJson";

const { layer } = defineProps<{
  layer: Layer;
}>();

const emit = defineEmits<{
  update: [layer: MapLayer];
  remove: [void];
}>();

const layerData = computed((): MapLayer | undefined => {
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
    const geoJsonData = parseGeoJson(layer.data as string);
    if (!geoJsonData) {
      log.error(`Layer ${layer.humanId} does not contain a valid GeoJSON`);
      return undefined;
    }
    return { ...base, geoJsonData } as MapLayer;
  }
  return base;
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
