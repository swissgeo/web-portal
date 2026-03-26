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
 *
 * Some notes on how all this is structured:
 * - We use the useGenericOgcData composable that contains the needed code to traverse the part
 *   of the OGC records that is generic for all the records
 * - Based on the inferred type of display, we also render the sub converters, see the template below
 * - The sub-converters ultimately deliver the data needed for openlayers to display the data
 * - The data from the sub-converter as well as some incoming data are together being merged into one object
 *   and the parent is informed about the changes
 */
import type { WMSLayerData } from './WmsLayer.vue'

import { useGenericOgcData } from './useGenericOgcData'

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

const { layerFormat, distribution, serviceData, layerId } = useGenericOgcData(computed(() => layer))

// holds the data that's specific for the layers from the sub mappers
const layerSpecificData = ref()

const layerZIndex = computed(() => zIndex)

/**
 * Reactively merge the data from the store as well as the
 * data from the OGC records
 */
const layerData = computed((): MapLayer => {
    return {
        layerId: layerId.value,
        format: layerFormat.value,
        uuid: layer.uuid,

        ...layerSpecificData.value,

        // some data we pass directly from the original, so when it's updated
        // the change will be reflected in the data that the map receives
        dimensions: layer.dimensions ?? null,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        zIndex: layerZIndex.value,
    }
})

// trigger the update to the parent
watch(layerData, () => emit('update', layerData.value), { immediate: true })

watch(locale, () => {
    refreshDataset()
})

onBeforeUnmount(() => {
    emit('remove')
})

// receive the layer specific data from the subconverters
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
