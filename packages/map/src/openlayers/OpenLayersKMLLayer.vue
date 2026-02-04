<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import useOlKMLLayer from '@/composables/olKMLLayer.composable'

const { layer } = defineProps<{
    layer: FileLayer
}>()

if (!layer.fileData) {
    throw new Error('KML layer has no file data')
}

const { initialize, setVisibility, setZIndex } = useOlKMLLayer(
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
