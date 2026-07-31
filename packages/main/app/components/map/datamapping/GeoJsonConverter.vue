<script setup lang="ts">
import type { Distribution } from "@swissgeo/ogc";

import type { GeoJsonLayerData } from "@/components/map/datamapping/useGeoJsonData";

import { useGeoJsonData } from "@/components/map/datamapping/useGeoJsonData";

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
  layerId: string | null;
}>();

const emit = defineEmits<{
  updateData: [opacity: number, data: GeoJsonLayerData];
}>();

const { layerData } = useGeoJsonData(
  toRef(props, "distribution"),
  toRef(props, "layerId"),
);

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
