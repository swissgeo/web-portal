<script lang="ts" setup>
import type { DatasetLayer, Layer } from '@swissgeo/layers'

import { computed } from 'vue'

import type { MapLayerRenderer } from '@/types'

import OpenLayersGeoJSONLayer from './OpenLayersGeoJSONLayer.vue'
import OpenLayersGPXLayer from './OpenLayersGPXLayer.vue'
import OpenLayersKMLLayer from './OpenLayersKMLLayer.vue'
import OpenLayersKMZLayer from './OpenLayersKMZLayer.vue'
import OpenLayersLocalGeoJSONLayer from './OpenLayersLocalGeoJSONLayer.vue'
import OpenLayersVectorLayer from './OpenLayersVectorLayer.vue'
import OpenLayersWMSLayer from './OpenLayersWMSLayer.vue'
import OpenLayersWMTSLayer from './OpenLayersWMTSLayer.vue'

const { layer, customLayerRenderers } = defineProps<{
    layer: Layer
    customLayerRenderers?: MapLayerRenderer[]
}>()

// Check if layer has a dataset (is DatasetLayer) or is a local file (FileLayer)
const isLocalFile = computed(
    () => !layer.dataset && 'fileData' in layer && layer.fileData !== undefined
)

const customLayerRenderer = computed(() =>
    customLayerRenderers?.find((renderer) => renderer.matches(layer))
)
</script>

<template>
    <component
        :is="customLayerRenderer.component"
        :layer="layer as Layer"
        v-if="customLayerRenderer"
    />
    <OpenLayersWMTSLayer
        :layer="layer as DatasetLayer"
        v-else-if="layer.type === 'wmts'"
    />
    <OpenLayersWMSLayer
        :layer="layer as DatasetLayer"
        v-else-if="layer.type === 'wms'"
    />
    <OpenLayersKMLLayer
        :layer="layer as Layer"
        v-else-if="layer.type === 'kml'"
    />
    <OpenLayersKMZLayer
        :layer="layer as Layer"
        v-else-if="layer.type === 'kmz'"
    />
    <OpenLayersGPXLayer
        :layer="layer as Layer"
        v-else-if="layer.type === 'gpx'"
    />
    <OpenLayersLocalGeoJSONLayer
        :layer="layer as Layer"
        v-else-if="layer.type === 'geojson' && isLocalFile"
    />
    <OpenLayersGeoJSONLayer
        :layer="layer as DatasetLayer"
        v-else-if="layer.type === 'geojson' && !isLocalFile"
    />
    <OpenLayersVectorLayer
        :layer="layer as DatasetLayer"
        v-else-if="layer.type === 'vector'"
    />
</template>
