<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import { useDatasetService } from "~/composables/useDatasetService";

const { distribution } = defineProps<{ distribution: Distribution }>();
const { address, isLoading, error } = useDatasetService(() => distribution);
const protocolLabels: Record<string, string> = {
  "ogc:wms": "WMS",
  "ogc:wmts": "WMTS",
  "ogcapi:stac": "STAC",
};
const protocol = computed(() => {
  const value = distribution.properties.protocol?.toLowerCase() ?? "";
  return protocolLabels[value] ?? value;
});
</script>

<template>
  <div class="flex flex-col gap-space-xs wrap-anywhere">
    <div class="flex items-center gap-space-xs font-semibold">
      <UIcon name="i-lucide-server" class="size-4 shrink-0" />
      {{ protocol }}
    </div>
    <ClientOnly>
      <p v-if="isLoading" role="status" class="text-sm text-muted">
        {{ $t("dataset.serviceLoading") }}
      </p>
      <p v-else-if="error" role="status" class="text-sm text-error">
        {{ $t("dataset.serviceError") }}
      </p>
      <ULink
        v-else-if="address"
        :to="address"
        target="_blank"
        class="max-w-full self-start text-sm"
      >
        {{ address }}
      </ULink>
    </ClientOnly>
    <p
      v-for="id in distribution.properties.externalIds"
      :key="id"
      class="text-sm text-muted"
    >
      {{ id }}
    </p>
  </div>
</template>
