<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import useOlLocalGeoJSONLayer from '../composables/olLocalGeoJSONLayer.composable'

const { layer } = defineProps<{
    layer: FileLayer
}>()

if (!layer.fileData) {
    throw new Error('GeoJSON layer has no file data')
}

const { initialize, setVisibility, setZIndex } = useOlLocalGeoJSONLayer(
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
