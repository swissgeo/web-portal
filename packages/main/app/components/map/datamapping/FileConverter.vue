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

const FORMAT_BY_TYPE: Record<string, LayerFormat> = {
  kml: "KML",
  kmz: "KMZ",
  gpx: "GPX",
  geojson: "GeoJSON",
};

const layerData = computed((): MapLayer => {
  const base = {
    ...layer,
    format:
      FORMAT_BY_TYPE[layer.type] ?? (layer.type.toUpperCase() as LayerFormat),
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
