<script lang="ts" setup>
import type { GeoAdminGeoJSONStyleDefinition } from '@swissgeo/layers'

import useOlGeoJSONLayer from '../composables/olGeoJSONLayer.composable'

const { layer } = defineProps<{
    layer: any
}>()

// Use the GeoJSON data directly from the layer (stored during import)
const geoJsonData = computed(() => {
    if (!layer.geoJsonData) {
        throw new Error('File layer has no GeoJSON data')
    }
    return layer.geoJsonData
})

// Default simple style for imported files
const defaultStyle: GeoAdminGeoJSONStyleDefinition = {
    type: 'single',
    property: '',
    geomType: 'point',
    vectorOptions: {
        type: 'circle',
        radius: 8,
        fill: { color: 'rgba(255, 0, 0, 0.6)' },
        stroke: { color: 'rgba(255, 0, 0, 1)', width: 2 },
    },
}

const { initialize, setVisibility, setZIndex } = useOlGeoJSONLayer(
    layer.humanId,
    layer.uuid,
    layer.opacity,
    layer.isLoading,
    geoJsonData,
    defaultStyle,
    layer.zIndex
)

watchEffect(() => {
    setVisibility(layer.isVisible)
})

watchEffect(() => {
    setZIndex(layer.zIndex)
})

onMounted(() => {
    initialize()
})
</script>

<template>
    <div></div>
</template>
