<script setup lang="ts">
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
    <!-- The child-route outlet must stay mounted while navigation resolves. -->
    <div
      v-show="detailsOpen && !mapViewStore.isFullscreenModeActive"
      class="absolute inset-y-0 left-0 z-60 w-full lg:w-1/2"
    >
      <NuxtPage :keepalive="false" />
    </div>
  </div>
</template>
