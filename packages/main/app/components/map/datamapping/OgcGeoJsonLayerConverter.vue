<script setup lang="ts">
import type { Distribution, Legend } from "@swissgeo/ogc";

import { getGeoJsonLegends } from "@swissgeo/ogc";

import type { GeoJsonLayerData } from "@/components/map/datamapping/useOgcGeoJsonData";

import { useOgcGeoJsonData } from "@/components/map/datamapping/useOgcGeoJsonData";

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
}>();

const emit = defineEmits<{
  error: [error: unknown];
  updateData: [opacity: number | null, GeoJsonLayerData];
  updateLegends: [legends: Legend[]];
}>();

const distribution = computed(() => props.distribution);

const { geoJsonLayerData } = useOgcGeoJsonData(distribution, (error) =>
  emit("error", error),
);

watch(
  geoJsonLayerData,
  () => {
    if (geoJsonLayerData.value) {
      emit("updateData", null, geoJsonLayerData.value);
    }
  },
  { immediate: true },
);

watch(
  () => getGeoJsonLegends(props.distribution),
  (legends) => emit("updateLegends", legends),
  { immediate: true },
);
</script>

<template><slot /></template>
