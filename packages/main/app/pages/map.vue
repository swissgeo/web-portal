<script setup lang="ts">
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
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

// The catalog belongs to the map. A user who leaves the map and comes back
// must not find the catalog still open. The catalog card of the landing page
// opens it again on purpose.
const sidebarStore = useSidebarStore();
onUnmounted(() => {
  if (sidebarStore.currentSidebar === SidebarType.GEOCATALOG_TREE) {
    sidebarStore.closeSidebar();
  }
});
</script>

<template>
  <div class="relative h-full">
    <!-- Starts at the sidebar edge (see default.vue). The dataset panel stays
         anchored to the left of the page, over the hidden sidebar. -->
    <div class="h-full md:ml-(--sidebar-width)">
      <MapViewer />
    </div>
    <DatasetPanelFrame
      :isVisible="detailsOpen && !mapViewStore.isFullscreenModeActive"
    >
      <NuxtPage :keepalive="false" />
    </DatasetPanelFrame>
  </div>
</template>
