<script setup lang="ts">
import type { Dataset, Distribution } from "@swissgeo/ogc";

import { useDistributionCollection } from "@swissgeo/ogc";
import { useSelectedDistribution } from "~/composables/useSelectedDistribution";
import { getDatasetVariants } from "~/utils/datasetVariants";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  dataset: Dataset;
  selectedDistributionId?: string;
}>();

const emit = defineEmits<{
  select: [distributionId: string];
}>();

const { t } = useI18n();

const dataset = computed(() => props.dataset);
const { distributionCollection } = useDistributionCollection(dataset);
const { distribution } = useSelectedDistribution(
  dataset,
  distributionCollection,
  () => props.selectedDistributionId,
);

// The API gives no variant title in some languages. The dataset title has a
// language fallback, so it names the variant instead.
function variantLabel(variant: Distribution) {
  return variant.properties.title || dataset.value.properties.title;
}

const items = computed(() =>
  getDatasetVariants(dataset.value, distributionCollection.value).map(
    (variant) => ({ label: variantLabel(variant), value: variant.id }),
  ),
);

function onSelect(distributionId: string) {
  if (distributionId !== distribution.value?.id) {
    emit("select", distributionId);
  }
}
</script>

<template>
  <div v-if="items.length" class="flex flex-col gap-1">
    <span class="text-xs font-medium text-toned">
      {{ t("layers.variant") }}
    </span>
    <UTooltip :text="distribution && variantLabel(distribution)">
      <USelect
        data-testid="layer-variant-select"
        data-vaul-no-drag
        :model-value="distribution?.id"
        :items="items"
        :ui="{ itemLabel: 'whitespace-normal' }"
        @update:model-value="onSelect"
      />
    </UTooltip>
  </div>
</template>
