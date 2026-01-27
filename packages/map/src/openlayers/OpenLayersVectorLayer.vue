<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'

import useOlVectorLayer from '../composables/olVectorLayer.composable'

const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const styleUrl = `/api/v1/layers/swissgeo/vectorTest`

const { setVisibility, setZIndex, setOpacity } = useOlVectorLayer(layer.dataset?.id ?? '', 1, styleUrl)

watch(
    () => layer.isVisible,
    (newVisibility) => setVisibility(newVisibility)
)

watch(
    () => layer.zIndex,
    (newZIndex) => setZIndex(newZIndex)
)

watch(
    () => layer.opacity,
    (newOpacity) => setOpacity(newOpacity)
)
</script>

<template>
    <slot />
</template>
