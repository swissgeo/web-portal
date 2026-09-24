<script setup lang="ts">
import type { Dataset } from "@swissgeo/ogc";

import { useDatasetLayer } from "~/composables/useDatasetLayer";

const { dataset } = defineProps<{ dataset: Dataset }>();
const { isOnMap, addToMap, removeFromMap } = useDatasetLayer(() => dataset);
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
      {{ $t("dataset.removeFromMap") }}
    </UButton>
    <UButton
      v-else
      icon="i-lucide-check"
      color="primary"
      variant="outline"
      @click="addToMap"
    >
      {{ $t("dataset.addToMap") }}
    </UButton>
  </div>
</template>
