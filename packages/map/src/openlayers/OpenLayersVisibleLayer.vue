<script lang="ts" setup>
import { computed } from 'vue'

import type { MapLayerRenderer, Layer } from '@/types/layers'

import { isWMTS, isWMS, isKML, isKMZ, isGPX, isGeoJSON } from '@/utils/recordUtils'

import OpenLayersGeoJSONLayer from './OpenLayersGeoJSONLayer.vue'
import OpenLayersGPXLayer from './OpenLayersGPXLayer.vue'
import OpenLayersKMLLayer from './OpenLayersKMLLayer.vue'
import OpenLayersKMZLayer from './OpenLayersKMZLayer.vue'
import OpenLayersLocalGeoJSONLayer from './OpenLayersLocalGeoJSONLayer.vue'
import OpenLayersWMSLayer from './OpenLayersWMSLayer.vue'
import OpenLayersWMTSLayer from './OpenLayersWMTSLayer.vue'

const { layer, customLayerRenderers } = defineProps<{
    layer: Layer
    customLayerRenderers?: MapLayerRenderer[]
}>()

// Check if layer has a dataset (is DatasetLayer) or is a local file (FileLayer)
const isLocalFile = computed(
    () => !('dataset' in layer) && 'fileData' in layer && layer.fileData !== undefined
)

const customLayerRenderer = computed(() =>
    customLayerRenderers?.find((renderer) => renderer.matches(layer))
)
</script>

<template>
    <component
        :is="customLayerRenderer.component"
        :layer="layer as Layer"
        :zIndex="layer.zIndex"
        v-if="customLayerRenderer"
    />
    <OpenLayersWMTSLayer
        :layer="layer"
        v-else-if="isWMTS(layer)"
    />
    <OpenLayersWMSLayer
        :layer="layer"
        v-else-if="isWMS(layer)"
    />
    <OpenLayersKMLLayer
        :layer="layer"
        v-else-if="isKML(layer)"
    />
    <OpenLayersKMZLayer
        :layer="layer"
        v-else-if="isKMZ(layer)"
    />
    <OpenLayersGPXLayer
        :layer="layer"
        v-else-if="isGPX(layer)"
    />
    <OpenLayersLocalGeoJSONLayer
        :layer="layer"
        v-else-if="isGeoJSON(layer) && isLocalFile"
    />
    <OpenLayersGeoJSONLayer
        :layer="layer"
        v-else-if="isGeoJSON(layer) && !isLocalFile"
    />
</template>
