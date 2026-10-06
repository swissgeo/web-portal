<script setup lang="ts">
import type { Distribution } from "@swissgeo/ogc";

import ErrorPill from "~/components/ErrorPill.vue";
import LayerLegend from "~/components/sidebar/LayerLegend.vue";
import { useDistributionLegend } from "~/composables/useDistributionLegend";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
  <ErrorPill v-if="error">
    {{ t("dataset.legendError") }}
  </ErrorPill>
  <p v-else-if="isLoading" role="status" class="text-sm text-muted">
    {{ t("dataset.legendLoading") }}
  </p>
  <LayerLegend v-else :legends="legends" presentation="detail" />
</template>
