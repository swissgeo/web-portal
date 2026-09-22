<!-- eslint multi-word: off-->
<script lang="ts" setup>
import log from "@swissgeo/log";
import { useDatasetPanelStore, useSidebarStore } from "@swissgeo/skeleton";

import DatasetPanel from "@/components/sidebar/DatasetPanel.vue";
import SideBar from "@/components/sidebar/SideBar.vue";

const { resetApp } = useResetApp();
const route = useRoute();
const mapViewStore = useMapViewStore();
const localePath = useLocalePath();
const datasetPanelStore = useDatasetPanelStore();
const sidebarStore = useSidebarStore();
const showDatasetPanel = computed(
  () =>
    isMapPage.value && !isMapFullscreenMode.value && datasetPanelStore.isOpen,
);

function closeDatasetDetail() {
  datasetPanelStore.closeDatasetPanel();
  sidebarStore.closeSidebar();
}

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
</script>

<template>
  <div class="flex h-screen flex-col">
    <Topbar v-if="!isMapFullscreenMode" @reset-app="resetApp" />
    <UMain as="div" class="min-h-0 flex-1">
      <main ref="main" class="h-full font-sans">
        <div class="relative flex h-full">
          <DatasetPanel
            v-if="showDatasetPanel"
            class="w-full shrink-0 lg:w-1/2"
            :detail-page-path="datasetDetailPath"
            :back-to-catalog="sidebarStore.isGeocatalogTreeVisible"
            @back="datasetPanelStore.closeDatasetPanel()"
            @close="closeDatasetDetail"
          />
          <SideBar
            v-if="!isMapFullscreenMode"
            v-show="!showDatasetPanel"
            class="z-10"
            :mapLayers="mapLayers"
          >
          </SideBar>
          <!-- Fixed map controls must stay inside the map pane beside details. -->
          <div
            class="h-full min-w-0 flex-1"
            :class="{ 'hidden [contain:layout] lg:block': showDatasetPanel }"
          >
            <slot />
          </div>
          <ClientOnly>
            <Footer v-if="!isMapFullscreenMode" />
          </ClientOnly>
        </div>
      </main>
    </UMain>
  </div>
</template>
