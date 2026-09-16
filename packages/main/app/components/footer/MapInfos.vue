<script setup lang="ts">
import { OLMapScale, useMapStore, OLMapMouseTracker } from "@swissgeo/map";

const { olMap } = storeToRefs(useMapStore());
</script>

<template>
  <div class="flex w-fit flex-col items-center gap-2 sm:flex-row sm:gap-8">
    <div class="w-60 justify-items-center">
      <OLMapScale :olMap="olMap" class="footerMapScale" />
    </div>
    <OLMapMouseTracker />
  </div>
</template>

<style scoped>
.footerMapScale {
  position: initial;
}
</style>
