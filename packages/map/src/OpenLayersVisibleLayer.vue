<script lang="ts" setup>
import type { Layer, ServerLayer } from '@swissgeo/layers'

import { LayerType } from '@swissgeo/layers'

import OpenLayersGeoJSONLayer from './OpenLayersGeoJSONLayer.vue'
import OpenLayersVectorLayer from './OpenLayersVectorLayer.vue'
import OpenLayersWMSLayer from './OpenLayersWMSLayer.vue'
import OpenLayersWMTSLayer from './OpenLayersWMTSLayer.vue'

const { layer } = defineProps<{ layer: Layer }>()
</script>

<template>
    <OpenLayersWMTSLayer
        :layer="layer as ServerLayer"
        v-if="layer.type === LayerType.WMTS"
    />
    <OpenLayersWMSLayer
        :layer="layer as ServerLayer"
        v-if="layer.type === LayerType.WMS"
    />
    <OpenLayersGeoJSONLayer
        :layer="layer as ServerLayer"
        v-if="layer.type === LayerType.GEOJSON"
    />
    <OpenLayersVectorLayer
        :layer="layer as ServerLayer"
        v-if="layer.type === LayerType.VECTOR"
    />
</template>
