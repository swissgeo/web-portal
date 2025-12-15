<script lang="ts" setup>
import OpenLayersScale from './OpenLayersScale.vue'
</script>

<template>
    <div class=".full-screen-map">
        <div></div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap>
            <OpenLayersScale />

            <slot />
        </OpenLayersMap>
    </div>
</template>

<style scoped>
/* .full-screen-map {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: white url("../../assets/grid.png");
} */
</style>
