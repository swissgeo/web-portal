<script setup lang="ts">
import type { Dimension, LayerInfo, Layer as SourceData } from '@swissgeo/layers'
import type { Layer as MapLayer } from '@swissgeo/map'
import type { Dataset } from '@swissgeo/ogc'

import { isDatasetLayer } from '@swissgeo/layers'

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
function updateLayerInfo(index: number | string, layerInfo: LayerInfo) {}

function updateOpacity(index: number, opacity: number) {
    mapViewStore.updateLayerOpacity(index, opacity)
}
function updateTimeDimension(index: number, dimension: Partial<Dimension>) {
    mapViewStore.updateLayerDimension(index, dimension, 'time')
}

function updateStoreLayerData(uuid: string, dataset: Dataset) {}
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
 */

// QUESTIONS

// v-bind key
// can I enforce a "once" on this ?
</script>

<template>
    <div v-for="(data, index) in [sourceBgLayer, ...sourceData].filter((data) => !!data)">
        <div
            :key="data.uuid"
            v-if="!data.hasBeenConverted"
        >
            <MapDatamappingOgcDatasetConverter
                v-if="isDatasetLayer(data)"
                :layer="data"
                :zIndex="index"
                @update="updateMapLayerData(index, $event)"
                @updateLayerInfo="updateLayerInfo"
                @updateOpacity="updateOpacity(index, 1)"
                @remove="removeLayerData(index)"
                @updateTimeDimension="updateTimeDimension(index, {})"
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
    </div>
</template>
