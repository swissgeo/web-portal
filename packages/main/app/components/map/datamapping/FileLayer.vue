<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'

const { layer, zIndex } = defineProps<{
    layer: Layer
    zIndex: number
}>()

const emit = defineEmits<{
    update: [layer: MapLayer]
    remove: [void]
}>()

const layerZIndex = computed(() => zIndex)

const layerData = computed(() => ({
    ...layer,
    zIndex: layerZIndex.value,
    type: layer.type.toUpperCase(),
}))

watch(
    () => layerData.value,
    () => emit('update', layerData.value),
    { immediate: true }
)

onBeforeUnmount(() => {
    emit('remove')
})
</script>

<template><slot></slot></template>
