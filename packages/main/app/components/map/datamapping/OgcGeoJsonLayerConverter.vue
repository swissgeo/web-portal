<script setup lang="ts">
import type { Distribution } from "@swissgeo/ogc";

import type { GeoJsonLayerData } from "@/components/map/datamapping/useOgcGeoJsonData";

import { useOgcGeoJsonData } from "@/components/map/datamapping/useOgcGeoJsonData";

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
  layerId: string | null;
}>();

const emit = defineEmits<{
  error: [error: unknown];
  updateData: [opacity: number | null, GeoJsonLayerData];
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
</script>

<template><slot /></template>
