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
const format = computed(() => determineFormat(distribution.value));
</script>

<template>
  <ClientOnly>
    <DatasetDistributionLegend
      v-if="distribution && layerId && format"
      :key="distribution.id"
      :distribution="distribution"
      :layer-id="layerId"
    />
    <LayerLegend v-else :legends="[]" presentation="detail" />
  </ClientOnly>
</template>
