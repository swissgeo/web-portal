<script setup lang="ts">
import type { Dimension, LayerInfo, Layer as SourceData } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'
import type { Dataset } from '@swissgeo/ogc'

import { isDatasetLayer, useLayerStore } from '@swissgeo/layers'

import MapDatamappingFileConverter from '@/components/map/datamapping/FileConverter.vue'
import MapDatamappingOgcDatasetConverter from '@/components/map/datamapping/OgcDatasetConverter.vue'

const { sourceBgLayer, sourceData } = defineProps<{
    sourceBgLayer: SourceData | null
    sourceData: SourceData[]
}>()

const mapViewStore = useMapViewStore()

function updateMapLayerData(index: number, mapLayerData: MapLayer) {
    mapViewStore.updateLayerData(index, mapLayerData, true)
}
function removeLayerData(index: number) {
    mapViewStore.removeLayer(index)
}
function updateLayerInfo(index: number, uuid: string, layerInfo: LayerInfo) {
    useLayerStore().setLayerInfo(uuid, layerInfo)
}

function updateOpacity(identifier: number | string, opacity: number) {
    // for some reason, the default opacity is not applied.
    // for some reason, the opacity is reset on language change
    mapViewStore.updateLayerOpacity(identifier, opacity)
}
function updateTimeDimension(identifier: number | string, dimension: Partial<Dimension>) {
    //useLayerStore().setDimension('time', identifier, dimension)
}

function updateStoreLayerData(index: number, uuid: string, dataset: Dataset) {
    if (index !== 0 || !useLayerStore().backgroundLayer) {
        useLayerStore().setLayerData(uuid, dataset)
    }
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
            @updateOpacity="updateOpacity"
            @remove="removeLayerData(index)"
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
