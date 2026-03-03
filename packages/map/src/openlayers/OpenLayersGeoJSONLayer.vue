<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { useRecordsData } from '@swissgeo/ogc'
import { useFetch } from '@vueuse/core'
import { computed, onMounted, watch } from 'vue'

import * as geoJsonUtils from '@/utils/geoJsonUtils'

import useOlGeoJSONLayer from '../composables/olGeoJSONLayer.composable'

const { layer, zIndex } = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const { geoJsonUrl, styleData } = await useRecordsData(layer.dataset, 'OGC:GeoJSON')

const { data } = await useFetch(geoJsonUrl.value).json<geoJsonUtils.FeatureCollectionWithCRS>()
const geoJsonData = computed(() => {
    if (!data.value) {
        throw new Error('Unable to read the geoJSON Data')
    }
    return data.value
})

const geoJsonStyle = computed(() => {
    if (!styleData || 'layers' in styleData) {
        log.error({
            title: 'OpenLayersGeoJSONLayer.vue',
            color: LogPreDefinedColor.Yellow,
            messages: ['Unable to read the geoJSON style', styleData],
        })
        throw new Error('Unable to read the geoJSON style')
    }
    return styleData
})

const { initialize, setZIndex, setVisibility, setOpacity } = useOlGeoJSONLayer(
    layer.dataset.id,
    layer.uuid,
    layer.opacity,
    layer.isLoading,
    geoJsonData.value,
    geoJsonStyle.value,
    zIndex
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

watch(
    () => layer.opacity,
    (newOpacity: number) => {
        setOpacity(newOpacity)
    }
)

onMounted(() => {
    initialize()
})
</script>

<template>
    <slot></slot>
</template>
