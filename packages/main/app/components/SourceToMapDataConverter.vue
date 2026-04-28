<script setup lang="ts">
import type { /*Dimension, LayerInfo,*/ Layer as SourceData } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'
//import type { Dataset } from '@swissgeo/ogc'

import { isDatasetLayer, useLayerStore } from '@swissgeo/layers'

import MapDatamappingFileConverter from '@/components/map/datamapping/FileConverter.vue'
import MapDatamappingOgcDatasetConverter from '@/components/map/datamapping/OgcDatasetConverter.vue'

const { sourceBgLayer, sourceData } = defineProps<{
    sourceBgLayer: SourceData | null
    sourceData: SourceData[]
}>()

const mapViewStore = useMapViewStore()
const layerStore = useLayerStore()

// there can be multiple calls to this function, and the options consumes themselves
// on call, so we consume the options first, then we give it the current data if there is
// some, and at last we revert to the default value only if there is no data and no options
function updateMapLayerData(index: number, mapLayerData: MapLayer) {
    const options = layerStore.consumeImportOptions(mapLayerData.uuid)
    const currentData = mapViewStore.getMapLayers().value[index]
    mapLayerData.opacity = options?.opacity ?? currentData?.opacity ?? 1
    mapLayerData.isVisible = options?.isVisible ?? currentData?.isVisible ?? true

    mapViewStore.updateLayerData(index, mapLayerData, true)
}
/*
function removeLayerData(index: number) {
    mapViewStore.removeLayer(index)
}
function updateLayerInfo(index: number, uuid: string, layerInfo: LayerInfo) {
    useLayerStore().setLayerInfo(uuid, layerInfo)
}

function updateStoreLayerData(index: number, uuid: string, dataset: Dataset) {
      if (index !== 0 || !useLayerStore().backgroundLayer) {
        useLayerStore().setLayerData(uuid, dataset)
    }
}
*/
function updateTimeDimension(identifier: number | string, dimension: Partial<Dimension>) {
    useLayerStore().setDimension('time', identifier, dimension)
}
function updateOpacity(identifier: number | string, opacity: number) {
    mapViewStore.updateLayerOpacity(identifier, opacity)
}
</script>

<template>
    <div
        v-for="(data, index) in [sourceBgLayer, ...sourceData].filter((data) => !!data)"
        v-bind:key="data.uuid"
    >
        <MapDatamappingOgcDatasetConverter
            v-if="isDatasetLayer(data)"
            :layer="data"
            :zIndex="index"
            @update="updateMapLayerData(index, $event)"
            @updateLayerInfo="updateLayerInfo"
            @remove="removeLayerData(index)"
            @updateOpacity="updateOpacity"
            @updateTimeDimension="updateTimeDimension"
            @updateDataset="updateStoreLayerData"
        />
        <MapDatamappingFileConverter
            v-else
            :layer="data"
            :zIndex="index"
            @update="updateMapLayerData(index, $event)"
            @remove="removeLayerData(index)"
        />
    </div>
</template>
