<script lang="ts" setup>
import type { NuxtError } from "#app";

import { useSidebarStore } from "@swissgeo/skeleton";
import DatasetPanel from "~/components/sidebar/DatasetPanel.vue";

definePageMeta({ path: "/dataset/:id", datasetDetail: true });

const sidebarStore = useSidebarStore();

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

function backToMap() {
  return navigateTo(localePath("/map"));
}

function closeDetails() {
  sidebarStore.closeSidebar();
  return backToMap();
}
</script>

<template>
  <DatasetPanel
    :detail-url="detailUrl"
    :dataset="dataset"
    :distribution-collection="distributionCollection"
    :distribution-error="distributionError"
    :is-loading="isLoading"
    :error="error"
    :back-to-catalog="sidebarStore.isGeocatalogTreeVisible"
    @back="backToMap"
    @close="closeDetails"
  />
</template>
