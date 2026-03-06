<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'

import { watch } from 'vue'

import useOlVectorLayer from '../composables/olVectorLayer.composable'

const { layer, zIndex } = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const styleUrl = `/api/v1/layers/swissgeo/vectorTest`

const { setVisibility, setZIndex, setOpacity } = useOlVectorLayer(
    layer.dataset?.id ?? '',
    zIndex,
    styleUrl
)

watch(
    () => layer.isVisible,
    (newVisibility) => setVisibility(newVisibility)
)

watch(
    () => zIndex,
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
