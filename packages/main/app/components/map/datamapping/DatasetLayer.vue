<script setup lang="ts">
import type { DatasetLayer, Dimension, LayerInfo } from '@swissgeo/layers'
import type { Layer as MapLayer, LayerType } from '@swissgeo/map'
import type { Dataset, Distribution } from '@swissgeo/ogc'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

/**
 * Dataset Layer Converter Container
 *
 * This is a sort of container component that is used to trigger the data fetching
 * from the OGC records.
 * This code maps the data from the layer store to the data structure needed by the
 * map module. The intermediate conversion is basically the traversal of the OGC dataset that
 * is being provided.
 */
import { getInfoFromDataset } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import {
    usePreferredDistribution,
    useDistribution,
    useDistributionCollection,
    useService,
} from '@swissgeo/ogc'

import type { WMSLayerData } from './WmsLayer.vue'

const { locale } = useI18n()

const emit = defineEmits<{
    update: [layer: MapLayer]
    updateTimeDimension: [layerUuid: string, dimension: Partial<Dimension>]
    updateOpacity: [layerUuid: string, opacity: number]
    remove: [void]
    updateDataset: [layerUuid: string, dataset: Dataset]
    updateLayerInfo: [layerUuid: string, info: LayerInfo]
}>()

const { layer, zIndex } = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const dataset = computed(() => layer.data)

// holds the data that's specific for the layers
const layerSpecificData = ref()

const { distributionCollection } = useDistributionCollection(dataset)
const { preferredDistributionId } = usePreferredDistribution(dataset)

// if there's a preferred distribution, let's get that one, otherwise the first one
const distributionId = computed(() => {
    if (
        !distributionCollection.value ||
        !distributionCollection.value ||
        !distributionCollection.value.records ||
        !distributionCollection.value.records.length
    ) {
        // If any of these is null-ish, then there's no point in returning the preferredDistributionId
        return null
    }
    return preferredDistributionId.value ?? distributionCollection.value.records[0]!.id
})

const { distribution, layerId } = useDistribution(distributionCollection, distributionId)
const { serviceData } = useService(distribution)

const layerTypeCache = ref<string | null>(null)

const layerType = computed(() =>
    layerTypeCache.value ? layerTypeCache.value : determineLayerType(distribution)
)
const layerZIndex = computed(() => zIndex)

/**
 * Reactively merge the data from the store as well as the
 * data from the OGC records
 */
const layerData = computed((): MapLayer => {
    return {
        layerId: layerId.value,
        type: layerType.value,
        ...layerSpecificData.value,

        uuid: layer.uuid,

        // some data we pass directly from the original, so when it's updated
        // the change will be reflected in the data that the map receives
        dimensions: layer.dimensions,
        isVisible: layer.isVisible,
        opacity: layer.opacity,
        zIndex: layerZIndex.value,
        displayName: layer.info?.displayName ?? layer.humanId,
    }
})

watch(locale, () => {
    refreshDataset()
})

watch(
    () => layerData.value,
    () => emit('update', layerData.value)
)

onBeforeUnmount(() => {
    emit('remove')
})

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

function determineLayerType(distribution: Ref<Distribution | null>): LayerType {
    if (!distribution || !distribution.value || !distribution.value.properties) {
        return null
    }

    const protocol = distribution.value.properties.protocol

    let type = null
    switch (protocol) {
        case 'OGC:WMTS':
            type = 'WMTS'
            break
        case 'OGC:WMS':
            type = 'WMS'
            break
        case 'OGC:GeoJSON':
            // intentionally not implementing geojson for the moment, as these layers might
            // undergo major changes
            type = 'GeoJSON'
            break
    }

    layerTypeCache.value = type
    return type
}

function pushLayerSpecificData<T>(data: T) {
    layerSpecificData.value = data
}
</script>

<template>
    <MapDatamappingWmtsLayer
        v-if="layerType === 'WMTS'"
        :distribution
        :serviceData
        :layerId
        @updateOptions="pushLayerSpecificData<{ options: WMTSOptions }>"
        @updateTimeDimension="emit('updateTimeDimension', layer.uuid, $event)"
        @updateOpacity="emit('updateOpacity', layer.uuid, $event)"
    ></MapDatamappingWmtsLayer>
    <MapDatamappingWmsLayer
        v-if="layerType === 'WMS'"
        :distribution
        :serviceData
        :layerId
        @updateData="pushLayerSpecificData<WMSLayerData>"
        @updateTimeDimension="emit('updateTimeDimension', layer.uuid, $event)"
        @updateOpacity="emit('updateOpacity', layer.uuid, $event)"
    ></MapDatamappingWmsLayer>
</template>
