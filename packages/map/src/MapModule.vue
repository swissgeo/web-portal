<script lang="ts" setup>
import log, { LogLevel } from '@swissgeo/log'
import { computed } from 'vue'

import type { MapLayerRenderer } from '@/types'
import type { Layer as MapLayer } from '@/types/layers'

import OpenLayersContextMenuPopup from './openlayers/OpenLayersContextMenuPopup.vue'
import OpenLayersMap from './openlayers/OpenLayersMap.vue'
import OpenLayersMouseTracker from './openlayers/OpenLayersMouseTracker.vue'
import OpenLayersScale from './openlayers/OpenLayersScale.vue'
import OpenLayersScalePrint from './openlayers/OpenLayersScalePrint.vue'

log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]

const { layers, customLayerRenderers } = defineProps<{
    layers: MapLayer[]
    customLayerRenderers?: MapLayerRenderer[]
    displayMode: 'web' | 'print'
}>()

const layersWithZIndex = computed(() => {
    // openlayers require a Zindex param. We set it to the layer orders here
    const mapLayers = layers.map((mapLayer, index) => {
        mapLayer.zIndex = index
        return mapLayer
    })
    return mapLayers
})
</script>

<template>
    <div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap
            :custom-layer-renderers="customLayerRenderers"
            :layers="layersWithZIndex"
        >
            <slot />

            <template v-if="displayMode === 'web'">
                <OpenLayersContextMenuPopup v-slot="slotProps">
                    <slot
                        name="context-menu-popup"
                        v-bind="slotProps"
                    />
                </OpenLayersContextMenuPopup>
                <OpenLayersMouseTracker />
                <OpenLayersScale />
            </template>
            <template v-else>
                <OpenLayersScalePrint />
            </template>
        </OpenLayersMap>
    </div>
</template>
