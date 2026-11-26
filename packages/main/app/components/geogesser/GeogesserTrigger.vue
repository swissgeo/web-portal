<script setup lang="ts">
/**
 * Opens the Geogesser game when the search text is "geoguessinggame". It is
 * mounted on all pages, because the search field is on all pages. The game
 * itself shows on the map, so this goes to the map when it is not open.
 */
import { useSearchStore } from "@swissgeo/skeleton";
import { watch } from "vue";

import { useGeogesserStore } from "@/stores/geogesser";
import { isGeogesserTrigger } from "@/utils/geogesser";

const searchStore = useSearchStore();
const geogesserStore = useGeogesserStore();
const route = useRoute();
const localePath = useLocalePath();

// The watcher runs after the search started: clearSearch then cancels its
// requests, so no result list opens for the trigger text
watch(
  () => searchStore.query,
  async (query) => {
    if (!isGeogesserTrigger(query)) {
      return;
    }
    searchStore.clearSearch();
    geogesserStore.open();
    if (!String(route.name ?? "").startsWith("map")) {
      await navigateTo(localePath("/map"));
    }
  },
);
</script>

<template>
  <span hidden />
</template>
