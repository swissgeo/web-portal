<script lang="ts" setup>
import type { DatasetLayer, Layer } from '@swissgeo/layers'

import { DRAWING_LAYER_ID } from '@swissgeo/drawing'
import { LayerType } from '@swissgeo/layers'

import OpenLayersDrawingLayer from './OpenLayersDrawingLayer.vue'
import OpenLayersGeoJSONLayer from './OpenLayersGeoJSONLayer.vue'
import OpenLayersGPXLayer from './OpenLayersGPXLayer.vue'
import OpenLayersKMLLayer from './OpenLayersKMLLayer.vue'
import OpenLayersKMZLayer from './OpenLayersKMZLayer.vue'
import OpenLayersLocalGeoJSONLayer from './OpenLayersLocalGeoJSONLayer.vue'
import OpenLayersVectorLayer from './OpenLayersVectorLayer.vue'
import OpenLayersWMSLayer from './OpenLayersWMSLayer.vue'
import OpenLayersWMTSLayer from './OpenLayersWMTSLayer.vue'

const { layer } = defineProps<{ layer: Layer }>()

// Check if layer has a dataset (is DatasetLayer) or is a local file (FileLayer)
const isLocalFile = computed(
    () => !layer.dataset && 'fileData' in layer && layer.fileData !== undefined
)

// Check if this is the drawing layer
const isDrawingLayer = computed(() => {
    const result = layer.humanId === DRAWING_LAYER_ID
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
    <OpenLayersLocalGeoJSONLayer
        :layer="layer as Layer"
        v-if="layer.type === LayerType.GEOJSON && isLocalFile"
    />
    <OpenLayersGeoJSONLayer
        :layer="layer as DatasetLayer"
        v-if="layer.type === LayerType.GEOJSON && !isLocalFile"
    />
    <OpenLayersVectorLayer
        :layer="layer as DatasetLayer"
        v-if="layer.type === LayerType.VECTOR"
    />
</template>
