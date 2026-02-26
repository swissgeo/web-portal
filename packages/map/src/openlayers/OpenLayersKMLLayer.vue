<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import { onMounted, watch } from 'vue'

import useOlKMLLayer from '@/composables/olKMLLayer.composable'

const props = defineProps<{
    layer: FileLayer
    zIndex: number
}>()

if (!props.layer.fileData) {
    throw new Error('KML layer has no file data')
}

const { initialize, setVisibility, setZIndex } = useOlKMLLayer(
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

onMounted(() => {
    initialize()
})
</script>

<template>
    <slot />
</template>
