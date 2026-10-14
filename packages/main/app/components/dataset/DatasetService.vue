<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import { useDatasetService } from "~/composables/useDatasetService";
import { determineFormat } from "~/utils/determineFormat";
import { useI18n } from "vue-i18n";

import DatasetCopyLink from "./DatasetCopyLink.vue";

const { t } = useI18n();

const { distribution } = defineProps<{ distribution: Distribution }>();
const emit = defineEmits<{ visibility: [visible: boolean] }>();
const { address, isLoading, error } = useDatasetService(() => distribution);
const isVisible = computed(() => {
  if (isLoading.value || error.value) {
    return true;
  }
  return Boolean(address.value);
});
watch(isVisible, (visible) => emit("visibility", visible), { immediate: true });
const protocol = computed(() => {
  const format = determineFormat(distribution);
  if (format === "STAC") {
    return "STAC Browser";
  }
  return format ?? distribution.properties.protocol?.toLowerCase() ?? "";
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
            {{ t("dataset.serviceLoading") }}
          </p>
          <p v-else-if="error" role="status" class="text-error">
            {{ t("dataset.serviceError") }}
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
            :aria-label="t('dataset.openService')"
            data-testid="dataset-service-open"
          />
        </div>
      </ClientOnly>
    </div>
  </div>
</template>
