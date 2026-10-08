<script setup lang="ts">
import { TimeSlider } from "@swissgeo/dimension";
import { useSidebarStore } from "@swissgeo/skeleton";

const mapViewStore = useMapViewStore();
const sidebarStore = useSidebarStore();
const isDesktop = useIsDesktop();

// On mobile the panels are bottom drawers, so no side column takes space on the left
const leftOffset = computed(
  () => (isDesktop.value ? sidebarStore.sidebarWidth : 0) + 8,
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
    class="fixed top-4 right-24 z-50"
    :style="{ left: leftOffset + 'px' }"
  >
    <TimeSlider @close="onClose" @update-visibility="onUpdateVisibility" />
  </div>
</template>
