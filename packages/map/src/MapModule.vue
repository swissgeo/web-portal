<script lang="ts" setup>
import type { MapLayerRenderer } from '@/types'
import type { Layer } from '@/types/layers'

import OpenLayersAttributionProvider from './openlayers/OpenLayersAttributionProvider.vue'
import OpenLayersContextMenuPopup from './openlayers/OpenLayersContextMenuPopup.vue'
import OpenLayersMap from './openlayers/OpenLayersMap.vue'
import OpenLayersMouseTracker from './openlayers/OpenLayersMouseTracker.vue'
import OpenLayersScale from './openlayers/OpenLayersScale.vue'

const { layers, backgroundLayer, customLayerRenderers } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer | null
    customLayerRenderers?: MapLayerRenderer[]
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
            <OpenLayersAttributionProvider
                :layers="layers"
                :background-layer="backgroundLayer"
                v-slot="slotProps"
            >
                <slot
                    name="map-footer-attribution"
                    v-bind="slotProps"
                />
            </OpenLayersAttributionProvider>
            <OpenLayersContextMenuPopup v-slot="slotProps">
                <slot
                    name="context-menu-popup"
                    v-bind="slotProps"
                />
            </OpenLayersContextMenuPopup>
            <OpenLayersMouseTracker />
        </OpenLayersMap>
    </div>
</template>

<style scoped></style>
