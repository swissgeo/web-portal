<!-- eslint multi-word: off-->
<script lang="ts" setup>
import log from "@swissgeo/log";
import { useSidebarStore } from "@swissgeo/skeleton";
import { panelSnapPointKey } from "~/types/injectionKeys";

import SideBar from "@/components/sidebar/SideBar.vue";

const { resetApp } = useResetApp();
const route = useRoute();
const mapViewStore = useMapViewStore();
const detailsOpen = computed(() => route.meta.datasetDetail === true);
provide(panelSnapPointKey, ref(null));

const mapLayers = computed(() => mapViewStore.getMapLayers());
const isMapPage = computed(() => {
  const routeName = String(route.name ?? "");
  return route.path.includes("/map") || routeName.includes("map");
});

const isMapFullscreenMode = computed(
  () => isMapPage.value && mapViewStore.isFullscreenModeActive,
);

const sidebarStore = useSidebarStore();
const sidebarWidth = computed(() =>
  isMapFullscreenMode.value ? "0px" : `${sidebarStore.sidebarContentWidth}px`,
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
    <TestSiteBanner />
    <Topbar v-if="!isMapFullscreenMode" @reset-app="resetApp" />
    <UMain as="div" class="min-h-0 flex-1">
      <main id="main" ref="main" class="h-full font-sans">
        <!-- The map and the footer leave --sidebar-width free on desktop, so
             the sidebar never covers them and hiding it does not resize them -->
        <div
          class="relative h-full"
          :style="{ '--sidebar-width': sidebarWidth }"
        >
          <SideBar
            v-if="!isMapFullscreenMode"
            :isVisible="!detailsOpen"
            class="z-99"
            :mapLayers="mapLayers"
          >
          </SideBar>
          <div class="relative h-full w-full">
            <slot />
            <ClientOnly>
              <Footer v-if="!isMapFullscreenMode" />
              <MobileNotice />
            </ClientOnly>
          </div>
        </div>
      </main>
    </UMain>
  </div>
</template>
