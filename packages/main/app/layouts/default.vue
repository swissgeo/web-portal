<!-- eslint multi-word: off-->
<script lang="ts" setup>
import log from "@swissgeo/log";
import DatasetPanelFrame from "~/components/dataset/DatasetPanelFrame.vue";

import SideBar from "@/components/sidebar/SideBar.vue";

const { resetApp } = useResetApp();
const route = useRoute();
const mapViewStore = useMapViewStore();
const { detailsOpen = false } = defineProps<{ detailsOpen?: boolean }>();

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
  <div class="flex h-dvh flex-col">
    <Topbar v-if="!isMapFullscreenMode" @reset-app="resetApp" />
    <UMain as="div" class="min-h-0 flex-1">
      <main ref="main" class="h-full font-sans">
        <div class="relative h-full">
          <SideBar
            v-if="!isMapFullscreenMode"
            v-show="!detailsOpen"
            class="z-10"
            :mapLayers="mapLayers"
          >
          </SideBar>
          <div class="relative isolate h-full w-full">
            <slot />
            <ClientOnly>
              <Footer v-if="!isMapFullscreenMode" />
            </ClientOnly>
          </div>
          <DatasetPanelFrame :visible="detailsOpen && !isMapFullscreenMode">
            <slot name="details" />
          </DatasetPanelFrame>
        </div>
      </main>
    </UMain>
  </div>
</template>
