<!-- eslint multi-word: off-->
<script lang="ts" setup>
import log from "@swissgeo/log";

import SideBar from "@/components/sidebar/SideBar.vue";

const { resetApp } = useResetApp();
const route = useRoute();
const mapViewStore = useMapViewStore();
const detailsOpen = computed(() => route.meta.datasetDetail === true);

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
      <main id="main" ref="main" class="h-full font-sans">
        <div class="relative h-full">
          <SideBar
            v-if="!isMapFullscreenMode"
            v-show="!detailsOpen"
            class="z-99"
            :mapLayers="mapLayers"
          >
          </SideBar>
          <div class="relative h-full w-full">
            <slot />
            <ClientOnly>
              <Footer v-if="!isMapFullscreenMode" />
            </ClientOnly>
          </div>
        </div>
      </main>
    </UMain>
  </div>
</template>
