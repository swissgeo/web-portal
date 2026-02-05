<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import useOlGPXLayer from '@/composables/olGPXLayer.composable'

const { layer } = defineProps<{
    layer: FileLayer
}>()

if (!layer.fileData) {
    throw new Error('GPX layer has no file data')
}

const { initialize, setVisibility, setZIndex } = useOlGPXLayer(
    layer.humanId,
    layer.uuid,
    layer.fileData,
    layer.opacity,
    layer.zIndex
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => layer.zIndex,
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
