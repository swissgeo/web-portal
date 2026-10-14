<script setup lang="ts">
import DatasetPanelFrame from "~/components/dataset/DatasetPanelFrame.vue";

// page key so map component persists when routings happen (like data detail)
definePageMeta({ key: "map" });

const route = useRoute();
const mapViewStore = useMapViewStore();
useSeoMeta({ title: "SWISSGEO" });
const detailsOpen = computed(() => route.meta.datasetDetail === true);

watch(detailsOpen, (isOpen) => {
  if (isOpen) {
    mapViewStore.exitFullscreenMode();
  }
});
</script>

<template>
  <div class="relative h-full">
    <MapViewer />
    <DatasetPanelFrame
      :isVisible="detailsOpen && !mapViewStore.isFullscreenModeActive"
    >
      <NuxtPage :keepalive="false" />
    </DatasetPanelFrame>
  </div>
</template>
