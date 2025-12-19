<script lang="ts" setup>
import log, { LogLevel } from '@swissgeo/log'

import BackgroundSelector from './BackgroundSelector.vue'
import OpenLayersMap from './openlayers/OpenLayersMap.vue'
// import OpenLayersScale from './OpenLayersScale.vue'

// TODO somehow the statement in main/app.vue doesn't do it
log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]
</script>

<template>
    <div class=".full-screen-map">
        <div></div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap>
            <!-- <OpenLayersScale /> -->

            <slot />
        </OpenLayersMap>
        <BackgroundSelector />
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
