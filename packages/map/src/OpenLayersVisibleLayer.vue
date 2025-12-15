<script lang="ts" setup>
import { Layer, LayerType } from '@swissgeo/layers'
const { layer } = defineProps<{ layer: Layer }>()

const zIndex = computed(() => 1)
</script>

<template>
    <OpenLayersWMTSLayer
        :layer="layer"
        :z-index="zIndex"
        v-if="layer.type === LayerType.WMTS"
    />
    <OpenLayersWMSLayer
        :layer="layer"
        :z-index="zIndex"
        v-if="layer.type === LayerType.WMS"
    />
</template>
