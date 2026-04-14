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
    mapViewStore.updateLayerData(index, mapLayerData)
}
function removeLayerData(index: number) {
    mapViewStore.removeLayer(index)
}
function updateLayerInfo(identifier: number | string, layerInfo: LayerInfo) {
    useLayerStore().setLayerInfo(identifier, layerInfo)
}

function updateOpacity(identifier: number | string, opacity: number) {
    // for some reason, the default opacity is not applied.
    // for some reason, the opacity is reset on language change
    mapViewStore.updateLayerOpacity(identifier, opacity)
}
function updateTimeDimension(identifier: number | string, dimension: Partial<Dimension>) {
    useLayerStore().setDimension('time', identifier, dimension)
}

function updateStoreLayerData(identifier: number | string, dataset: Dataset) {
    useLayerStore().setLayerData(identifier, dataset)
}
/**
 * What do I receive ?
 *  FROM ABOVE:
 *      --> SourceData to turn into MapData
 *          --> changing language should trigger this, as source data will change
 *      --> Initial State to set initial Options
 *  FROM "BELOW":
 *      --> update "dimensions"
 *      --> update "opacity" and "visibility"
 *      --> alter order
 * What do I give back ?
 *  --> a MapData Array in the store
 *  --> when a new Layer is added, we need to send it to the source
 *
 *
 * questions
 *
 *  adding layer to the store
 *      - order shouldn't matter in the layers store
 *      - order should matter in the map store
 */

// QUESTIONS

// v-bind key
// can I enforce a "once" on this ?
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
