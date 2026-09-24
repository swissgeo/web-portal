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
  <NuxtLayout :details-open="detailsOpen">
    <MapViewer />
    <template #details>
      <NuxtPage :keepalive="false" />
    </template>
  </NuxtLayout>
</template>
