<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import { useDatasetService } from "~/composables/useDatasetService";

import DatasetCopyLink from "./DatasetCopyLink.vue";

const { distribution } = defineProps<{ distribution: Distribution }>();
const { address, isLoading, error } = useDatasetService(() => distribution);
const protocolLabels: Record<string, string> = {
  "ogc:wms": "WMS",
  "ogc:wmts": "WMTS",
  "ogcapi:stac": "STAC Browser",
};
const protocol = computed(() => {
  const value = distribution.properties.protocol?.toLowerCase() ?? "";
  return protocolLabels[value] ?? value;
});
</script>

<template>
  <div class="grid gap-space-xs p-space-s text-sm @2xl:grid-cols-[7rem_1fr]">
    <p class="order-2 wrap-anywhere @2xl:order-none">
      {{ protocol }}
    </p>
    <div class="order-1 flex min-w-0 items-start gap-space-xs @2xl:order-none">
      <div class="min-w-0 flex-1 wrap-anywhere">
        <ClientOnly>
          <p v-if="isLoading" role="status" class="text-muted">
            {{ $t("dataset.serviceLoading") }}
          </p>
          <p v-else-if="error" role="status" class="text-error">
            {{ $t("dataset.serviceError") }}
          </p>
          <p v-else-if="address" class="font-semibold @2xl:font-normal">
            {{ address }}
          </p>
        </ClientOnly>
      </div>
      <ClientOnly>
        <div v-if="address && !isLoading && !error" class="flex shrink-0">
          <DatasetCopyLink
            :url="address"
            default-icon="i-lucide-copy"
            data-testid="dataset-service-copy"
          />
          <UButton
            :to="address"
            target="_blank"
            icon="i-lucide-external-link"
            color="primary"
            variant="ghost"
            :aria-label="$t('dataset.openService')"
            data-testid="dataset-service-open"
          />
        </div>
      </ClientOnly>
    </div>
    <div
      v-if="distribution.properties.externalIds?.length"
      class="order-3 min-w-0 wrap-anywhere text-muted @2xl:col-start-2"
    >
      <p v-for="id in distribution.properties.externalIds" :key="id">
        {{ $t("dataset.identifier") }}: {{ id }}
      </p>
    </div>
  </div>
</template>
