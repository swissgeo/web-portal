<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import { onMounted, watch } from 'vue'

import useOlKMZLayer from '@/composables/olKMZLayer.composable'

const props = defineProps<{
    layer: FileLayer
    zIndex: number
}>()

if (!props.layer.fileData) {
    throw new Error('KMZ layer has no file data')
}

const { initialize, setVisibility, setZIndex, setOpacity } = useOlKMZLayer(
    props.layer.humanId,
    props.layer.uuid,
    props.layer.fileData,
    props.layer.opacity,
    props.zIndex
)

watch(
    () => props.layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => props.zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

watch(
    () => props.layer.opacity,
    (newOpacity: number) => {
        setOpacity(newOpacity)
    }
)

onMounted(async () => {
    await initialize()
})
</script>

<template>
    <slot />
</template>
