<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import ErrorPill from "~/components/ErrorPill.vue";
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
  <div
    class="grid grid-cols-[minmax(0,1fr)_auto] gap-space-xs px-space-xs py-4 text-sm leading-small-text font-medium @2xl:min-h-13 @2xl:grid-cols-[7rem_minmax(0,1fr)_auto] @2xl:px-space-s @2xl:py-4"
  >
    <p class="wrap-anywhere">
      {{ protocol }}
    </p>
    <div class="row-start-2 wrap-anywhere @2xl:row-start-auto">
      <ClientOnly>
        <p v-if="isLoading" role="status" class="text-muted">
          {{ t("dataset.serviceLoading") }}
        </p>
        <ErrorPill v-else-if="error">
          {{ t("dataset.serviceError") }}
        </ErrorPill>
        <p v-else-if="address">
          {{ address }}
        </p>
      </ClientOnly>
    </div>
    <ClientOnly>
      <div
        v-if="address && !isLoading && !error"
        class="col-start-2 row-span-2 row-start-1 flex self-start @2xl:col-start-auto @2xl:row-span-1 @2xl:row-start-auto"
      >
        <UTooltip :text="t('dataset.openService')">
          <UButton
            :to="address"
            target="_blank"
            icon="i-lucide-external-link"
            color="accent"
            variant="ghost"
            :aria-label="t('dataset.openService')"
            data-testid="dataset-service-open"
          />
        </UTooltip>
        <DatasetCopyLink
          :url="address"
          :label="t('dataset.copy')"
          default-icon="i-lucide-copy"
          data-testid="dataset-service-copy"
        />
      </div>
    </ClientOnly>
  </div>
</template>
