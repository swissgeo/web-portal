<script lang="ts" setup>
// this component holds an accordion with all selected features from one layer.

import type { AccordionItem } from "@nuxt/ui";
import type { FeatureData } from "@swissgeo/feature";

import FeatureInfoContent from "@/components/featuresinfo/FeatureInfoContent.vue";

const { featuresData } = defineProps<{
  featuresData: FeatureData[];
}>();

const accordionItems: Ref<AccordionItem[]> = computed(() =>
  featuresData.map((featureData, index) => {
    return {
      label: featureData.featureId,
      featureData,
      defaultOpen: index === 0,
    };
  }),
);
</script>

<template>
  <UAccordion :items="accordionItems" type="multiple">
    <template #body="{ item }">
      <FeatureInfoContent :feature-data="item.featureData"></FeatureInfoContent>
    </template>
  </UAccordion>
</template>
