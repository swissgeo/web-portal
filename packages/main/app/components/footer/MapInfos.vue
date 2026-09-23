<script setup lang="ts">
import { OLMapScale, useMapStore, OLMapMouseTracker } from "@swissgeo/map";

const { olMap } = storeToRefs(useMapStore());
</script>

<template>
  <div class="flex w-fit flex-row items-center gap-8">
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
