<script setup lang="ts">
import type { Dimension } from "@swissgeo/layers";
import type { Distribution, Service } from "@swissgeo/ogc";
import type { Options } from "ol/source/WMTS";

import { processTimeInfo } from "./processTimeInfo";
import { useOgcWmtsData } from "./useOgcWmtsData";

// not destructuring these to keep the reactivity
const props = defineProps<{
  distribution: Distribution | null;
  serviceData: Service | null;
  layerId: string | null;
}>();

const emit = defineEmits<{
  updateOptions: [opacity: number | null, { options: Options }];
  updateTimeDimension: [dimension: Partial<Dimension>];
}>();

const distribution = computed(() => props.distribution);
const serviceData = computed(() => props.serviceData);
const layerId = computed(() => props.layerId);
const { timeInfo, options, defaultOpacity } = useOgcWmtsData(
  distribution,
  serviceData,
  layerId,
);

watch(timeInfo, () => {
  const dimension = processTimeInfo(timeInfo);
  emit("updateTimeDimension", dimension);
});

watch(
  [options, defaultOpacity],
  ([_new_options, new_opacity], [_old_options, old_opacity]) => {
    if (
      options.value &&
      (defaultOpacity.value || old_opacity === new_opacity)
    ) {
      emit("updateOptions", defaultOpacity.value, {
        options: options.value,
      });
    }
  },
  { immediate: true },
);
</script>

<template><slot /></template>
