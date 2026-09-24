<script setup lang="ts">
import type { Dataset, DistributionCollection } from "@swissgeo/ogc";

import { useDistribution, usePreferredDistribution } from "@swissgeo/ogc";
import LayerLegend from "~/components/sidebar/LayerLegend.vue";
import { determineFormat } from "~/utils/determineFormat";
import { computed } from "vue";

import DatasetDistributionLegend from "./DatasetDistributionLegend.vue";

const props = defineProps<{
  dataset: Dataset;
  distributionCollection: DistributionCollection | null;
}>();

const { preferredDistributionId } = usePreferredDistribution(
  computed(() => props.dataset),
);
// Match the representation selected by Add to map.
const distributionId = computed(
  () =>
    preferredDistributionId.value ??
    props.distributionCollection?.features.at(0)?.id ??
    null,
);
const { distribution, layerId } = useDistribution(
  computed(() => props.distributionCollection),
  distributionId,
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
