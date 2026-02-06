<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'

import log, { LogPreDefinedColor } from '@swissgeo/log';

import useOlGeoJSONLayer from '../composables/olGeoJSONLayer.composable'
import { useRecordsData } from '@swissgeo/ogc';

const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const { geoJsonUrl, styleData } = await useRecordsData(layer.dataset, 'OGC:GeoJSON')

const { data } = await useFetch<object>(geoJsonUrl.value)

const geoJsonData = computed(() => {
    if (!data.value) {
        throw new Error('Unable to read the geoJSON Data')
    }
    return data.value
})

const geoJsonStyle = computed(() => {
    if (!styleData) {
        log.error({
            title: 'OpenLayersGeoJSONLayer.vue',
            color: LogPreDefinedColor.Yellow,
            messages:[
                'Unable to read the geoJSON style',
                styleData
            ]
        })
        throw new Error('Unable to read the geoJSON style')
    }
    return styleData
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
