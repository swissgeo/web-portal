<script setup lang="ts">
import type { DatasetLayer, Dimension, LayerInfo } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'
import type { Dataset } from '@swissgeo/ogc'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

import { getInfoFromDataset } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'

/**
 * Dataset Layer Converter Container
 *
 * This is a sort of container component that is used to trigger the data fetching
 * from the OGC records.
 * This code maps the data from the layer store to the data structure needed by the
 * map module. The intermediate conversion is basically the traversal of the OGC dataset that
 * is being provided.
 */
import type { WMSLayerData } from './WmsLayer.vue'

import { useDatasetLayer } from './useDatasetLayer'

const { locale } = useI18n()

const { layer, zIndex } = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const emit = defineEmits<{
    update: [layer: MapLayer]
    updateTimeDimension: [layerUuid: string, dimension: Partial<Dimension>]
    updateOpacity: [layerUuid: string, opacity: number]
    remove: [void]
    updateDataset: [layerUuid: string, dataset: Dataset]
    updateLayerInfo: [layerUuid: string, info: LayerInfo]
}>()

const { layerType, layerSpecificData, distribution, serviceData, layerId } = useDatasetLayer(
    layer,
    zIndex,
    () => emit('remove'),
    (...args) => emit('update', ...args)
)

watch(locale, () => {
    refreshDataset()
})

function pushLayerSpecificData<T>(data: T) {
    layerSpecificData.value = data
}

function refreshDataset() {
    log.debug({
        title: 'DatasetLayer',
        titleColor: LogPreDefinedColor.Red,
        messages: ['Refreshing the dataset for', layerId.value],
    })

    if (!layer.data.links) {
        return
    }
    const datasetLinkObject = layer.data.links.filter((link) => link.rel === 'self')
    if (datasetLinkObject.length === 0) {
        // TODO think about some error handling and toast that into the user's face
        return
    }
    if (!datasetLinkObject[0] || !datasetLinkObject[0].href) {
        // TODO think about some error handling and toast that into the user's face
        return
    }
    const datasetUrl = new URL(datasetLinkObject[0].href)

    // Change the query param
    datasetUrl.searchParams.set('language', locale.value)

    // Get back a string
    const newUrlString = datasetUrl.toString()

    const { data: dataset } = useFetch<Dataset>(newUrlString)

    watch(
        dataset,
        () => {
            if (dataset.value) {
                emit('updateDataset', layer.uuid, dataset.value)
                emit('updateLayerInfo', layer.uuid, getInfoFromDataset(dataset.value))
            }
        },
        { immediate: true }
    )
}
</script>

<template>
    <MapDatamappingWmtsLayer
        v-if="layerFormat === 'WMTS'"
        :distribution
        :serviceData
        :layerId
        @updateOptions="pushLayerSpecificData<{ options: WMTSOptions }>"
        @updateTimeDimension="emit('updateTimeDimension', layer.uuid, $event)"
        @updateOpacity="emit('updateOpacity', layer.uuid, $event)"
    ></MapDatamappingWmtsLayer>
    <MapDatamappingWmsLayer
        v-if="layerFormat === 'WMS'"
        :distribution
        :serviceData
        :layerId
        @updateData="pushLayerSpecificData<WMSLayerData>"
        @updateTimeDimension="emit('updateTimeDimension', layer.uuid, $event)"
        @updateOpacity="emit('updateOpacity', layer.uuid, $event)"
    ></MapDatamappingWmsLayer>
</template>
