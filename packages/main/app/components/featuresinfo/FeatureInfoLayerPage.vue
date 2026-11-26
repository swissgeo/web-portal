<script lang="ts" setup>
// this component holds an accordion with all selected features from one layer,
// or an error pill when the features of the layer could not be loaded.

import type { AccordionItem } from "@nuxt/ui";
import type { FeatureData } from "@swissgeo/feature";

import FeatureInfoContent from "@/components/featuresinfo/FeatureInfoContent.vue";
import FeatureInfoLayerError from "@/components/featuresinfo/FeatureInfoLayerError.vue";

const { featuresData } = defineProps<{
  featuresData: FeatureData[] | null;
}>();

const accordionItems: Ref<AccordionItem[]> = computed(() =>
  (featuresData ?? []).map((featureData, index) => {
    return {
      label: featureData.label ?? featureData.featureId,
      featureData,
      defaultOpen: index === 0,
    };
  }),
);
</script>

<template>
  <FeatureInfoLayerError v-if="!featuresData" />
  <UAccordion
    v-else
    :items="accordionItems"
    type="multiple"
    data-testid="feature-info-layer-page"
  >
    <template #body="{ item }">
      <FeatureInfoContent :feature-data="item.featureData"></FeatureInfoContent>
    </template>
  </UAccordion>
</template>
