<script setup lang="ts">
import type { Distribution } from "@swissgeo/ogc";

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
  <UBadge
    v-if="error"
    role="status"
    color="error"
    size="sm"
    icon="i-lucide-octagon-alert"
    class="rounded-full bg-red-600 px-1 py-0.5 leading-small-text text-white dark:bg-error dark:text-red-950"
  >
    {{ t("dataset.legendError") }}
  </UBadge>
  <p v-else-if="isLoading" role="status" class="text-sm text-muted">
    {{ t("dataset.legendLoading") }}
  </p>
  <LayerLegend v-else :legends="legends" presentation="detail" />
</template>
