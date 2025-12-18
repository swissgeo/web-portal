<script lang="ts" setup>
import { Layer, LayerType } from '@swissgeo/layers'
const { layer } = defineProps<{ layer: Layer }>()
</script>

<template>
    <OpenLayersWMTSLayer
        :layer="layer"
        v-if="layer.type === LayerType.WMTS"
    />
    <OpenLayersWMSLayer
        :layer="layer"
        v-if="layer.type === LayerType.WMS"
    />
</template>
