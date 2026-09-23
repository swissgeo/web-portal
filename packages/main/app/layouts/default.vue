<!-- eslint multi-word: off-->
<script lang="ts" setup>
import log from "@swissgeo/log";

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
  <div class="flex h-screen flex-col">
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
          </div>
          <ClientOnly>
            <Footer v-if="!isMapFullscreenMode" />
          </ClientOnly>
          <!-- Nuxt needs the child-route outlet to complete navigation. Using v-if
               here can block navigation while detailsOpen waits for the new route. -->
          <div
            v-show="detailsOpen && !isMapFullscreenMode"
            class="absolute inset-y-0 left-0 z-20 w-full lg:w-1/2"
          >
            <slot name="details" />
          </div>
        </div>
      </main>
    </UMain>
  </div>
</template>
