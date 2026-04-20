<script lang="ts" setup>
import { computed } from 'vue'

import type { MapLayerRenderer } from '@/types'
import type { Layer } from '@/types/layers'

import OpenLayersContextMenuPopup from './openlayers/OpenLayersContextMenuPopup.vue'
import OpenLayersMap from './openlayers/OpenLayersMap.vue'
import OpenLayersMouseTracker from './openlayers/OpenLayersMouseTracker.vue'
import OpenLayersScale from './openlayers/OpenLayersScale.vue'

export interface AttributionSource {
    id: string
    name: string
    url?: string
}

const { layers, backgroundLayer, customLayerRenderers } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer | null
    customLayerRenderers?: MapLayerRenderer[]
}>()

const attributionSources = computed((): AttributionSource[] => {
    const visibleLayers = layers.filter((layer) => layer.isVisible)

    const attributedLayers: Layer[] = []

    if (backgroundLayer?.isVisible && backgroundLayer.info?.attribution?.title) {
        attributedLayers.push(backgroundLayer)
    }

    attributedLayers.push(...visibleLayers.filter((layer) => !!layer.info?.attribution?.title))

    return attributedLayers
        .map((layer) => {
            const title = layer.info?.attribution?.title
            if (!title) return null
            return {
                id: title.replace(/[._]/g, '-'),
                name: title,
                url: layer.info?.attribution?.url,
            }
        })
        .filter((source): source is AttributionSource => !!source)
        .filter((source, index, array) => array.findIndex((s) => s.name === source.name) === index)
})
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
            <slot
                name="map-footer-attribution"
                :sources="attributionSources"
            />
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
