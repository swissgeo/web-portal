<script setup lang="ts">
import { OLMapScale, useMapStore, OLMapMouseTracker } from "@swissgeo/map";

const { olMap } = storeToRefs(useMapStore());
</script>

<template>
  <div
    class="flex w-fit flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-8"
  >
    <div class="ml-2 w-60">
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
