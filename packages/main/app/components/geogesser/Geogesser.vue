<script setup lang="ts">
/**
 * Entry of the Geogesser game, a hidden game like the easter eggs. The search
 * text "geoguessinggame" opens the game. This component only watches the search and
 * loads the game when it opens: no other component knows about the game.
 */
import { useSearchStore } from "@swissgeo/skeleton";
import { watch } from "vue";

import { useGeogesserStore } from "@/stores/geogesser";
import { isGeogesserTrigger } from "@/utils/geogesser";

const searchStore = useSearchStore();
const geogesserStore = useGeogesserStore();

// The watcher runs after the search started: clearSearch then cancels its
// requests, so no result list opens for the trigger text
watch(
  () => searchStore.query,
  (query) => {
    if (isGeogesserTrigger(query)) {
      searchStore.clearSearch();
      geogesserStore.open();
    }
  },
);
</script>

<template>
  <LazyGeogesserGame v-if="geogesserStore.isOpen" />
</template>
