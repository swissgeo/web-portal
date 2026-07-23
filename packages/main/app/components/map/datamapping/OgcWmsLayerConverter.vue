<script setup lang="ts">
import type { Dimension } from "@swissgeo/dimension";
import type { Distribution, Service } from "@swissgeo/ogc";

import type { WMSLayerData } from "@/components/map/datamapping/useOgcWmsData";

import { processTimeInfo } from "@/components/map/datamapping/processTimeInfo";
import { useOgcWmsData } from "@/components/map/datamapping/useOgcWmsData";

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
  serviceData: Service | null;
  layerId: string | null;
}>();

const emit = defineEmits<{
  updateData: [opacity: number | null, WMSLayerData];
  updateTimeDimension: [dimension: Partial<Dimension>];
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
  [wmsDataForOl, defaultOpacity],
  ([_new_options, new_opacity], [_old_options, old_opacity]) => {
    if (
      wmsDataForOl.value &&
      (defaultOpacity.value || old_opacity === new_opacity)
    ) {
      emit("updateData", defaultOpacity.value, wmsDataForOl.value);
    }
  },
  { immediate: true },
);
</script>

<template><slot /></template>
