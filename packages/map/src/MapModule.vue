<script lang="ts" setup>
import type { MapLayerRenderer } from '@/types'
import type { Layer } from '@/types/layers'

import OpenLayersContextMenuPopup from './openlayers/OpenLayersContextMenuPopup.vue'
import OpenLayersMap from './openlayers/OpenLayersMap.vue'
import OpenLayersMouseTracker from './openlayers/OpenLayersMouseTracker.vue'
import OpenLayersScale from './openlayers/OpenLayersScale.vue'
import log, { LogLevel } from '@swissgeo/log'
import OpenLayersScalePrint from './openlayers/OpenLayersScalePrint.vue'

log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]

const { layers, backgroundLayer, customLayerRenderers } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer | null
    customLayerRenderers?: MapLayerRenderer[]
    displayMode: 'web' | 'print',
}>()

</script>

<template>
    <div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap
            :backgroundLayer="backgroundLayer"
            :custom-layer-renderers="customLayerRenderers"
            :layers="layers"
        >
            <slot />

            <template v-if="displayMode === 'web'">
                <OpenLayersContextMenuPopup v-slot="slotProps" >
                    <slot
                        name="context-menu-popup"
                        v-bind="slotProps"
                    />
                </OpenLayersContextMenuPopup>
                <OpenLayersMouseTracker/>
                <OpenLayersScale />
                <!-- 
                <MapFooterAttributionList
                    :layers="layers"
                    :background-layer="backgroundLayer"
                />
                -->
            </template>
            <template v-else>
                <OpenLayersScalePrint/>
            </template>
        </OpenLayersMap>
    </div>
</template>
