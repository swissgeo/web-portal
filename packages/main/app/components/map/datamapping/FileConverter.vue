<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'
import type { LayerFormat, Layer as MapLayer } from '@swissgeo/map'

const { layer } = defineProps<{
    layer: Layer
}>()

const emit = defineEmits<{
    update: [layer: MapLayer]
    remove: [void]
}>()

const layerFormat = computed((): LayerFormat => layer.type.toUpperCase() as LayerFormat)

const layerData = computed(
    (): Partial<MapLayer> => ({
        ...layer,
        format: layerFormat.value,
        layerId: layer.humanId,
        //type: layer.type.toUpperCase(),
        displayName: layer.info?.displayName ?? layer.humanId,
        opacity: 1,
        isVisible: true,
    })
)

watch(layerData, () => emit('update', layerData.value as MapLayer), { immediate: true })

onBeforeUnmount(() => {
    emit('remove')
})
</script>

<template><slot></slot></template>
