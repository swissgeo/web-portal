<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";

import { useFeaturesStore } from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";

import FeatureInfoLayerPage from "./FeatureInfoLayerPage.vue";

const featureStore = useFeaturesStore();
const layerStore = useLayerStore();

const featureDataByUuid = computed(() => featureStore.selectedFeaturesByUuid);

const tabs: Ref<TabsItem[]> = computed(() =>
  Object.entries(featureDataByUuid.value).map(([layerUuid, featuresData]) => {
    const layer = layerStore.getLayer(layerUuid);
    return {
      value: layerUuid,
      label: layer?.info?.displayName ?? layer?.humanId ?? layerUuid,
      featuresData,
    };
  }),
);

const active = ref(tabs.value[0]?.value);

watch(featureDataByUuid, () => {
  active.value = tabs.value[0]?.value;
});
</script>
<template>
  <UTabs v-model="active" :items="tabs">
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
