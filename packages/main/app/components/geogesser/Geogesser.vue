<script setup lang="ts">
/**
 * Map part of the Geogesser game, a hidden game like the easter eggs. It loads
 * the game only while the game is open (see GeogesserTrigger).
 */
import { useGeogesserStore } from "@/stores/geogesser";

const geogesserStore = useGeogesserStore();
</script>

<template>
  <LazyGeogesserGame v-if="geogesserStore.isOpen" />
</template>
