<script setup lang="ts">
import type { Dimension } from "@swissgeo/layers";
import type { Distribution, Service } from "@swissgeo/ogc";

import type { WMSLayerData } from "./useOgcWmsData";

import { processTimeInfo } from "./processTimeInfo";
import { useOgcWmsData } from "./useOgcWmsData";

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
  serviceData: Service | null;
  layerId: string | null;
}>();

const emit = defineEmits<{
  updateData: [WMSLayerData];
  updateTimeDimension: [dimension: Partial<Dimension>];
  updateOpacity: [opacity: number];
}>();

const distribution = computed(() => props.distribution);
const serviceData = computed(() => props.serviceData);
const layerId = computed(() => props.layerId);

const { defaultOpacity, wmsDataForOl, timeInfo } = useOgcWmsData(
  distribution,
  serviceData,
  layerId,
);

watch(timeInfo, () => {
  const dimension = processTimeInfo(timeInfo);
  emit("updateTimeDimension", dimension);
});

watch(
  defaultOpacity,
  () => {
    if (defaultOpacity.value !== null) {
      emit("updateOpacity", defaultOpacity.value);
    }
  },
  { immediate: true },
);

watch(wmsDataForOl, () => {
  if (wmsDataForOl.value) {
    emit("updateData", wmsDataForOl.value);
  }
});
</script>

<template><slot /></template>
