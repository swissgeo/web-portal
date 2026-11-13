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
// GeoJSON reads its legend from the `legend` link; WMS / WMTS need the layer
// id to find it in the capabilities.
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
