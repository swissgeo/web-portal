<script lang="ts" setup>
import type { NuxtError } from "#app";

import { useLayerStore } from "@swissgeo/layers";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import DatasetPanel from "~/components/sidebar/DatasetPanel.vue";

definePageMeta({
  path: "/dataset/:id",
  datasetDetail: true,
  key: (route) => {
    const { id } = route.params;
    return typeof id === "string" ? id : "dataset";
  },
});

const sidebarStore = useSidebarStore();
const layerStore = useLayerStore();

const route = useRoute();
const localePath = useLocalePath();
const requestUrl = useRequestURL();
const detailUrl = computed(() => new URL(route.path, requestUrl.origin).href);

const id = computed(() => {
  const value = route.params.id;
  return typeof value === "string" ? value : null;
});

const {
  dataset,
  distributionCollection,
  distributionError,
  isLoading,
  error,
  promise,
} = useDatasetRecord(id);

function maybeShowError(e: NuxtError | undefined) {
  if (!e) {
    return;
  }
  showError({ status: e.status ?? 404, message: "dataset", fatal: true });
}

// Server prefetch hooks run in parallel. Wait for the dataset request before
// checking its error so the server can return the correct HTTP status.
onServerPrefetch(async () => {
  await promise;
  maybeShowError(error.value);
});

// On client navigation:
// error.value starts null and is set after fetch
// watch picks it up as soon as it resolves.
watch(error, maybeShowError);

useSeoMeta({
  title: () => dataset.value?.properties.title,
  description: () => dataset.value?.properties.description,
});

// Uses the route id, which is known before the dataset record loads
const isDatasetOnMap = computed(() =>
  layerStore.layers.some((layer) => layer.humanId === id.value),
);

const isBackToCatalog = computed(() => {
  // Opened from a panel: back returns to that panel
  if (sidebarStore.isSidebarOpen) {
    return sidebarStore.isGeocatalogTreeVisible;
  }
  // Opened by a link: back goes to the map when the dataset is on it,
  // otherwise to the catalog, so the user can find more data
  return !isDatasetOnMap.value;
});

function backToMap() {
  return navigateTo(localePath("/map"));
}

function goBack() {
  if (isBackToCatalog.value) {
    sidebarStore.setSidebar(SidebarType.GEOCATALOG_TREE);
  }
  return backToMap();
}

function closeDetails() {
  sidebarStore.closeSidebar();
  return backToMap();
}
</script>

<template>
  <!-- UDrawer does not support SSR in the installed version. -->
  <ClientOnly>
    <DatasetPanel
      :detail-url="detailUrl"
      :dataset="dataset"
      :distribution-collection="distributionCollection"
      :distribution-error="distributionError"
      :is-loading="isLoading"
      :error="error"
      :back-to-catalog="isBackToCatalog"
      @back="goBack"
      @close="closeDetails"
    />
  </ClientOnly>
</template>
