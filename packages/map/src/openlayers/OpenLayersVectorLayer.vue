<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'

import { watch } from 'vue'

import useOlVectorLayer from '../composables/olVectorLayer.composable'

const props = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const styleUrl = `/api/v1/layers/swissgeo/vectorTest`

const { setVisibility, setZIndex, setOpacity } = useOlVectorLayer(
    props.layer.dataset?.id ?? '',
    props.zIndex,
    styleUrl
)

watch(
    () => props.layer.isVisible,
    (newVisibility) => setVisibility(newVisibility)
)

watch(
    () => props.zIndex,
    (newZIndex) => setZIndex(newZIndex)
)

watch(
    () => props.layer.opacity,
    (newOpacity) => setOpacity(newOpacity)
)
</script>

<template>
    <slot />
</template>
