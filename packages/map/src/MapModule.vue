<script lang="ts" setup>
import type { MapLayerRenderer } from '@/types'
import type { Layer } from '@/types/layers'

import OpenLayersContextMenuPopup from './openlayers/OpenLayersContextMenuPopup.vue'
import OpenLayersMap from './openlayers/OpenLayersMap.vue'
import OpenLayersMouseTracker from './openlayers/OpenLayersMouseTracker.vue'
import OpenLayersScale from './openlayers/OpenLayersScale.vue'

// TODO somehow the statement in main/app.vue doesn't do it
log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]

const { layers, backgroundLayer, customLayerRenderers, mouseTracker = true } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer | null
    customLayerRenderers?: MapLayerRenderer[]
    mouseTracker?: boolean
}>()

</script>

<template>
    <div class=".full-screen-map">
        <div></div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap
            :backgroundLayer="backgroundLayer"
            :custom-layer-renderers="customLayerRenderers"
            :layers="layers"
        >
            <!-- <OpenLayersScale /> -->
            <slot />
            <OpenLayersScale />
            <OpenLayersContextMenuPopup v-slot="slotProps">
                <slot
                    name="context-menu-popup"
                    v-bind="slotProps"
                />
            </OpenLayersContextMenuPopup>
            <OpenLayersMouseTracker v-if="mouseTracker" />
        </OpenLayersMap>
    </div>
</template>

<style scoped></style>
