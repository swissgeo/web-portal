<!-- eslint multi-word: off-->
<script lang="ts" setup>
import type { SearchResult } from "@swissgeo/search";

import log from "@swissgeo/log";
import { useDatasetPanelStore } from "@swissgeo/skeleton";

import DatasetPanel from "@/components/sidebar/DatasetPanel.vue";
import SideBar from "@/components/sidebar/SideBar.vue";
import { useSearchSelection } from "@/composables/useSearchSelection";

const route = useRoute();
const mapViewStore = useMapViewStore();
const localePath = useLocalePath();
const datasetPanelStore = useDatasetPanelStore();

const datasetDetailPath = computed(() => {
  if (!datasetPanelStore.activeDatasetId) {
    return undefined;
  }
  return localePath(`/dataset/${datasetPanelStore.activeDatasetId}`);
});

const mapLayers = computed(() => mapViewStore.getMapLayers());
const isMapPage = computed(() => {
  const routeName = String(route.name ?? "");
  return route.path.includes("/map") || routeName.includes("map");
});

const isMapFullscreenMode = computed(
  () => isMapPage.value && mapViewStore.isFullscreenModeActive,
);

watch(route, (value) => {
  log.debug("route has changed", value.fullPath);

  if (!isMapPage.value && mapViewStore.isFullscreenModeActive) {
    mapViewStore.exitFullscreenMode();
  }
});

// Handle search result selection
const { handleResultSelection } = useSearchSelection();

async function onSearchResultSelected(result: SearchResult) {
  await handleResultSelection(result);
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <Topbar
      v-if="!isMapFullscreenMode"
      @search-result-selected="onSearchResultSelected"
    />
    <UMain as="div" class="min-h-0 flex-1">
      <main ref="main" class="h-full font-sans">
        <div class="relative h-full">
          <SideBar
            v-if="isMapPage && !isMapFullscreenMode"
            class="z-2"
            :mapLayers="mapLayers"
            :show-map-controls="isMapPage"
          >
          </SideBar>
          <div
            class="h-full w-full"
            :class="isMapPage && !isMapFullscreenMode ? 'pl-20' : 'pl-0'"
          >
            <slot />
          </div>
          <DatasetPanel
            v-if="!isMapFullscreenMode"
            :detail-page-path="datasetDetailPath"
          />
        </div>
      </main>
    </UMain>
  </div>
</template>
