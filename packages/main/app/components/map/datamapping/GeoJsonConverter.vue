<script setup lang="ts">
import type { GeoJSONLayer } from "@swissgeo/map";
import type { Distribution } from "@swissgeo/ogc";

import { LV95 } from "@swissgeo/coordinates";
import { geoadminToMapLibreStyle, isMapLibreStyle } from "@swissgeo/map";
import { useGeoJson } from "@swissgeo/ogc";

type GeoJsonLayerData = Pick<
  GeoJSONLayer,
  "geoJsonData" | "geoJsonStyle" | "mapLibreStyle" | "mapLibreIcons"
>;

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
  layerId: string | null;
}>();

const emit = defineEmits<{
  updateData: [opacity: number, data: GeoJsonLayerData];
}>();

const distribution = computed(() => props.distribution);
const { geoJsonData } = useGeoJson(distribution);

// Classify the fetched style once per fetch: an already-standard MapLibre style is
// passed straight through; a legacy geoadmin "literals" style is converted here (in
// the app layer, since `ol` builds before `map` and cannot import the converter).
const layerData = computed<GeoJsonLayerData | null>(() => {
  const { geoJsonData: features, geoJsonStyle: style } = geoJsonData.value;

  if (!features || Object.keys(features).length === 0) {
    return null;
  }

  if (!style || Object.keys(style).length === 0) {
    return { geoJsonData: features };
  }

  if (isMapLibreStyle(style)) {
    return { geoJsonData: features, mapLibreStyle: style };
  }

  const { style: mapLibreStyle, icons } = geoadminToMapLibreStyle(
    style,
    props.layerId ?? "geojson",
    { resolutionToZoom: (resolution) => LV95.getZoomForResolution(resolution) },
  );
  return { geoJsonData: features, mapLibreStyle, mapLibreIcons: icons };
});

watch(
  layerData,
  (data) => {
    if (data) {
      emit("updateData", 1, data);
    }
  },
  { immediate: true },
);
</script>

<template><slot /></template>
