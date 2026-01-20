<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'

import useLayerData from '@/composables/useLayerData.composable'

import useOlGeoJSONLayer from '../composables/olGeoJSONLayer.composable'

const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const { url, styleData } = await useLayerData(layer.dataset, 'OGC:GeoJSON')

const { data } = await useFetch<string>(`/api/v1/layers/swissgeo/geoJson/${url.value}`)

const geoJsonData = computed(() => {
    if (!data.value) {
        throw new Error('Unable to read the geoJSON Data')
    }
    return data.value
})

const geoJsonStyle = computed(() => {
    if (!styleData.value) {
        throw new Error('Unable to read the geoJSON style')
    }
    return styleData.value
})

const { initialize, setZIndex, setVisibility } = useOlGeoJSONLayer(
    layer.dataset.id,
    layer.uuid,
    layer.opacity,
    layer.isLoading,
    geoJsonData.value,
    geoJsonStyle.value,
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
    <slot></slot>
</template>
