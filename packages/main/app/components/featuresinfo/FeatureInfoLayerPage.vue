<script lang="ts" setup>
// this component holds an accordion with all selected features from one layer.

import type { AccordionItem } from "@nuxt/ui";
import type { FeatureData } from "@swissgeo/feature";

import FeatureInfoContent from "@/components/featuresinfo/FeatureInfoContent.vue";

const { featuresData } = defineProps<{
  featuresData: FeatureData[];
}>();

const accordionItems: Ref<AccordionItem[]> = computed(() =>
  featuresData.map((featureData) => {
    return {
      label: featureData.label ?? featureData.featureId,
      featureData,
    };
  }),
);
</script>

<template>
  <UAccordion
    :items="accordionItems"
    type="multiple"
    data-testid="feature-info-layer-page"
    :default-value="['0']"
    :ui="{ label: 'flex min-w-0 flex-1' }"
  >
    <template #default="{ item }">
      <UTooltip :text="item.label">
        <span class="truncate">{{ item.label }}</span>
      </UTooltip>
    </template>
    <template #body="{ item }">
      <FeatureInfoContent :feature-data="item.featureData"></FeatureInfoContent>
    </template>
  </UAccordion>
</template>
