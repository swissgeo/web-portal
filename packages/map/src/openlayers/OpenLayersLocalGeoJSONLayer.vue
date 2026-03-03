<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import { watch, onMounted } from 'vue'

import useOlLocalGeoJSONLayer from '../composables/olLocalGeoJSONLayer.composable'

const { layer, zIndex } = defineProps<{
    layer: FileLayer
    zIndex: number
}>()

if (!layer.fileData) {
    throw new Error('GeoJSON layer has no file data')
}

const { initialize, setVisibility, setZIndex, setOpacity } = useOlLocalGeoJSONLayer(
    layer.humanId,
    layer.uuid,
    layer.fileData,
    layer.opacity,
    zIndex
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

watch(
    () => layer.opacity,
    (newOpacity: number) => {
        setOpacity(newOpacity)
    }
)

onMounted(() => {
    initialize()
})
</script>

<template>
    <slot />
</template>
