<script lang="ts" setup>
import type { DatasetLayer, Layer } from '@swissgeo/layers'

import { LayerType } from '@swissgeo/layers'

import OpenLayersDrawingLayer from './OpenLayersDrawingLayer.vue'
import OpenLayersGeoJSONLayer from './OpenLayersGeoJSONLayer.vue'
import OpenLayersGPXLayer from './OpenLayersGPXLayer.vue'
import OpenLayersKMLLayer from './OpenLayersKMLLayer.vue'
import OpenLayersKMZLayer from './OpenLayersKMZLayer.vue'
import OpenLayersVectorLayer from './OpenLayersVectorLayer.vue'
import OpenLayersWMSLayer from './OpenLayersWMSLayer.vue'
import OpenLayersWMTSLayer from './OpenLayersWMTSLayer.vue'

const { layer } = defineProps<{ layer: Layer }>()

// Check if this is the drawing layer
const isDrawingLayer = computed(() => {
    const result = layer.humanId === 'user-drawing-layer'
    return result
})
</script>

<template>
    <OpenLayersWMTSLayer
        :layer="layer as DatasetLayer"
        v-if="layer.type === LayerType.WMTS"
    />
    <OpenLayersWMSLayer
        :layer="layer as DatasetLayer"
        v-if="layer.type === LayerType.WMS"
    />
    <OpenLayersDrawingLayer
        :layer="layer as Layer"
        v-if="isDrawingLayer && layer.type === LayerType.KML"
    />
    <OpenLayersKMLLayer
        :layer="layer as Layer"
        v-if="!isDrawingLayer && layer.type === LayerType.KML"
    />
    <OpenLayersKMZLayer
        :layer="layer as Layer"
        v-if="layer.type === LayerType.KMZ"
    />
    <OpenLayersGPXLayer
        :layer="layer as Layer"
        v-if="layer.type === LayerType.GPX"
    />
    <OpenLayersGeoJSONLayer
        :layer="layer as DatasetLayer"
        v-if="layer.type === LayerType.GEOJSON"
    />
    <OpenLayersVectorLayer
        :layer="layer as DatasetLayer"
        v-if="layer.type === LayerType.VECTOR"
    />
</template>
