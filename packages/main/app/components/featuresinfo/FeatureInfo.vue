<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";
import type { FeatureData } from "@swissgeo/feature";

import { useFeaturesStore } from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";

import FeatureInfoLayerPage from "./FeatureInfoLayerPage.vue";

// Stacked shows every layer below the other, for narrow screens
const { isStacked = false } = defineProps<{ isStacked?: boolean }>();

const featureStore = useFeaturesStore();
const layerStore = useLayerStore();

const featureDataByUuid = computed(() => featureStore.selectedFeaturesByUuid);

function layerTab(layerUuid: string, featuresData: FeatureData[] | null) {
  const layer = layerStore.getLayer(layerUuid);
  return {
    value: layerUuid,
    label: layer?.info?.displayName ?? layer?.humanId ?? layerUuid,
    featuresData,
  };
}

// A failed layer has no features, its page shows an error instead
const tabs: Ref<TabsItem[]> = computed(() => [
  ...Object.entries(featureDataByUuid.value).map(([layerUuid, featuresData]) =>
    layerTab(layerUuid, featuresData),
  ),
  ...featureStore.failedLayerUuids.map((layerUuid) =>
    layerTab(layerUuid, null),
  ),
]);

const active = ref(tabs.value[0]?.value);

watch(featureDataByUuid, () => {
  active.value = tabs.value[0]?.value;
});
</script>
<template>
  <div
    v-if="isStacked"
    class="flex flex-col gap-4 px-4 pb-4"
    data-testid="feature-info-sections"
  >
    <section v-for="tab in tabs" :key="tab.value" class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-highlighted">{{ tab.label }}</h3>
      <FeatureInfoLayerPage :features-data="tab.featuresData" />
    </section>
  </div>
  <UTabs
    v-else
    v-model="active"
    :items="tabs"
    data-testid="feature-info-tabs"
    :ui="{ content: 'max-h-[33vh] overflow-y-auto' }"
  >
    <template #default="{ item }">
      <UTooltip :text="item.label">
        <span class="max-w-40 truncate">{{ item.label }}</span>
      </UTooltip>
    </template>

    <template #content="{ item }">
      <FeatureInfoLayerPage :features-data="item.featuresData" />
    </template>
  </UTabs>
</template>
