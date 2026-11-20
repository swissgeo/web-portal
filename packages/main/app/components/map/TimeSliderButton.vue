<script setup lang="ts">
import { TimeSlider } from "@swissgeo/dimension";
import { useSidebarStore } from "@swissgeo/skeleton";

const mapViewStore = useMapViewStore();
const sidebarStore = useSidebarStore();
const isDesktop = useIsDesktop();

// On mobile the panels are bottom drawers, so no side column takes space on the left
const leftOffset = computed(
  () => (isDesktop.value ? sidebarStore.sidebarContentWidth : 0) + 8,
);

function onClose() {
  mapViewStore.closeTimeSlider();
}

function onUpdateVisibility({
  uuid,
  isVisible,
}: {
  uuid: string;
  isVisible: boolean;
}) {
  mapViewStore.setVisibility(uuid, isVisible);
}
</script>

<template>
  <div
    v-if="mapViewStore.isTimeSliderVisible"
    class="fixed right-24 z-50"
    :class="
      mapViewStore.isFullscreenModeActive
        ? 'top-[calc(var(--test-site-banner-height,0px)+1rem)]'
        : 'top-[calc(var(--test-site-banner-height,0px)+var(--ui-header-height)+1rem)]'
    "
    :style="{ left: leftOffset + 'px' }"
  >
    <!-- Below the test site banner and the topbar, which is hidden in fullscreen -->
    <TimeSlider @close="onClose" @update-visibility="onUpdateVisibility" />
  </div>
</template>
