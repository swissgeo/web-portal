<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import log, { LogLevel } from '@swissgeo/log'

import OpenLayersMap from './openlayers/OpenLayersMap.vue'
import OpenLayersScale from './openlayers/OpenLayersScale.vue'

// TODO somehow the statement in main/app.vue doesn't do it
log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]

const { layers, backgroundLayer } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer
}>()
</script>

<template>
    <div class=".full-screen-map">
        <div></div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap :backgroundLayer="backgroundLayer" :layers="layers">
            <!-- <OpenLayersScale /> -->
            <slot />
            <OpenLayersScale />
            <BackgroundSelector />
        </OpenLayersMap>
    </div>
</template>

<style scoped></style>
