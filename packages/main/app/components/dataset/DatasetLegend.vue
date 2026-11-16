<script setup lang="ts">
import type { Dataset, DistributionCollection } from "@swissgeo/ogc";

import LayerLegend from "~/components/sidebar/LayerLegend.vue";
import { useSelectedDistribution } from "~/composables/useSelectedDistribution";
import { determineFormat } from "~/utils/determineFormat";
import { computed } from "vue";

import DatasetDistributionLegend from "./DatasetDistributionLegend.vue";

const props = defineProps<{
  dataset: Dataset;
  distributionCollection: DistributionCollection | null;
}>();

const { distribution, layerId } = useSelectedDistribution(
  computed(() => props.dataset),
  computed(() => props.distributionCollection),
);
// GeoJSON reads its legend straight from the distribution's `legend` link, so
// it needs no layer id. WMS / WMTS legends live in the service capabilities,
// listed per layer: `layerId` (the distribution's `externalIds[0]`) is the
// layer name used to look it up there, so without it there is no legend.
const supportsLegend = computed(() => {
  const format = determineFormat(distribution.value);
  if (format === "GeoJSON") {
    return true;
  }
  return (format === "WMS" || format === "WMTS") && !!layerId.value;
});
</script>

<template>
  <DatasetDistributionLegend
    v-if="distribution && supportsLegend"
    :key="distribution.id"
    :distribution="distribution"
    :layer-id="layerId"
  />
  <LayerLegend v-else :legends="[]" presentation="detail" />
</template>
