<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import useOlKMZLayer from '../composables/olKMZLayer.composable'

const { layer } = defineProps<{
    layer: FileLayer
}>()

if (!layer.fileData) {
    throw new Error('KMZ layer has no file data')
}

const { initialize, setVisibility, setZIndex } = useOlKMZLayer(
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

onMounted(async () => {
    await initialize()
})
</script>

<template>
    <slot />
</template>
