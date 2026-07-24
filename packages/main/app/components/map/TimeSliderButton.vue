<script setup lang="ts">
import { TimeSlider } from "@swissgeo/dimension";
import { useSidebarStore } from "@swissgeo/skeleton";

const mapViewStore = useMapViewStore();
const sidebarStore = useSidebarStore();

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
    :style="{ left: sidebarStore.sidebarWidth + 8 + 'px' }"
  >
    <TimeSlider @close="onClose" @update-visibility="onUpdateVisibility" />
  </div>
</template>
