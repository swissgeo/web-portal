<script setup lang="ts">
import type { Dataset } from "@swissgeo/ogc";

import { isMappableDataset } from "@swissgeo/ogc";
import { useDatasetLayer } from "~/composables/useDatasetLayer";
import { computed, useId } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { dataset } = defineProps<{ dataset: Dataset }>();
const { isOnMap, addToMap, removeFromMap } = useDatasetLayer(() => dataset);
const isMappable = computed(() => isMappableDataset(dataset));
const hintId = useId();

async function addIfMappable(): Promise<void> {
  if (isMappable.value) {
    await addToMap();
  }
}
</script>

<template>
  <div class="shrink-0" data-testid="dataset-map-action">
    <UButton
      v-if="isOnMap"
      icon="i-lucide-trash-2"
      color="neutral"
      variant="outline"
      @click="removeFromMap"
    >
      {{ t("dataset.removeFromMap") }}
    </UButton>
    <DatasetNotMappableHint v-else :show-hint="!isMappable">
      <UButton
        data-testid="dataset-add-to-map"
        icon="i-lucide-check"
        color="primary"
        variant="outline"
        :aria-disabled="!isMappable || undefined"
        :aria-describedby="isMappable ? undefined : hintId"
        @click="addIfMappable"
      >
        {{ t("dataset.addToMap") }}
      </UButton>
    </DatasetNotMappableHint>
    <span v-if="!isOnMap && !isMappable" :id="hintId" class="sr-only">
      {{ t("dataset.notMappable") }}
    </span>
  </div>
</template>
