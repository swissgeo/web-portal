<script setup lang="ts">
import type { Distribution } from "@swissgeo/ogc";

import LayerLegend from "~/components/sidebar/LayerLegend.vue";
import { useDistributionLegend } from "~/composables/useDistributionLegend";

const { distribution, layerId } = defineProps<{
  distribution: Distribution;
  layerId: string;
}>();

const { legends, isLoading, error } = useDistributionLegend(
  () => distribution,
  () => layerId,
);
</script>

<template>
  <p v-if="error" role="status" class="text-sm text-error">
    {{ $t("dataset.legendError") }}
  </p>
  <p v-else-if="isLoading" role="status" class="text-sm text-muted">
    {{ $t("dataset.legendLoading") }}
  </p>
  <LayerLegend v-else :legends="legends" presentation="detail" />
</template>
