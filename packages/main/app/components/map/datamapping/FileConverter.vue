<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'
import type { LayerFormat, Layer as MapLayer } from '@swissgeo/map'

const { layer, zIndex } = defineProps<{
    layer: Layer
    zIndex: number
}>()

const emit = defineEmits<{
    update: [layer: MapLayer]
    remove: [void]
}>()

const layerZIndex = computed(() => zIndex)

const layerFormat = computed((): LayerFormat => layer.type.toUpperCase() as LayerFormat)

const layerData = computed(() => ({
    ...layer,
    zIndex: layerZIndex.value,
    type: layer.type.toUpperCase(),
    displayName: layer.info?.displayName ?? layer.humanId,
    format: layerFormat.value,
    layerId: layer.humanId,
}))

watch(layerData, () => emit('update', layerData.value), { immediate: true })

onBeforeUnmount(() => {
    emit('remove')
})
</script>

<template><slot></slot></template>
