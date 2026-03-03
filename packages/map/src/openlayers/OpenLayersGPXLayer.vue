<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import { onMounted, watch } from 'vue'

import useOlGPXLayer from '@/composables/olGPXLayer.composable'

const { layer, zIndex } = defineProps<{
    layer: FileLayer
    zIndex: number
}>()

if (!layer.fileData) {
    throw new Error('GPX layer has no file data')
}

const { initialize, setVisibility, setZIndex, setOpacity } = useOlGPXLayer(
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
