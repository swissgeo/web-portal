<script lang="ts" setup>
import type { AccordionItem } from "@nuxt/ui";

import { useFeaturesStore } from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";

import FeatureInfoLayerPage from "./FeatureInfoLayerPage.vue";

const featureStore = useFeaturesStore();
const layerStore = useLayerStore();

const featureDataByUuid = computed(() => featureStore.selectedFeaturesByUuid);

const accordionItems: Ref<AccordionItem[]> = computed(() =>
  Object.entries(featureDataByUuid.value).map(([layerUuid, featuresData]) => {
    const layer = layerStore.getLayer(layerUuid);
    return {
      value: layerUuid,
      label: layer?.info?.displayName ?? layer?.humanId ?? layerUuid,
      featuresData,
    };
  }),
);
</script>
<template>
  <div class="max-h-[33vh] overflow-y-auto">
    <UAccordion
      :items="accordionItems"
      type="multiple"
      data-testid="feature-info-accordion"
      :ui="{ trigger: 'sticky top-0 z-10 bg-elevated' }"
      :default-value="accordionItems.map((item) => `${item.value}`)"
    >
      <template #default="{ item }">
        <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
          <UTooltip :text="item.label">
            <span class="truncate font-semibold">{{ item.label }}</span>
          </UTooltip>
          <span class="text-xs text-muted">{{ item.featuresData.length }}</span>
        </div>
      </template>
      <template #body="{ item }">
        <FeatureInfoLayerPage :features-data="item.featuresData" />
      </template>
    </UAccordion>
  </div>
</template>
