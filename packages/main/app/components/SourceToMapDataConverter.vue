<script setup lang="ts">
import { isDatasetLayer, type Dimension, type Layer as SourceData } from '@swissgeo/layers'
import { MapDatasetLayer, MapFileLayer } from '../../.nuxt/components'
import type { Layer as MapLayer } from '@swissgeo/map'

const { sourceBgLayer, sourceData } = defineProps<{
    sourceBgLayer: SourceData | null
    sourceData: SourceData[]
}>()

function updateMapLayerData(index: number, mapLayerData: MapLayer) {
    console.log(index)
    console.log(mapLayerData)
}
function removeLayerData(index: number | string) {
    console.log(index)
}
function updateLayerInfo(index: number) {
    console.log(index)
}

function updateOpacity(index: number) {}
function updateTimeDimension(index: number, dimension: Partial<Dimension>) {}

function updateStoreLayerData(index: number, dataset: SourceData) {}
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
 *  -->
 *
 *
 * questions
 *
 *  adding layer to the store
 *      - order shouldn't matter in the layers store
 *      - order should matter in the map store
 */
</script>

<template>
    <div v-for="(data, index) in [sourceBgLayer, ...sourceData].filter((data) => !!data)">
        <MapDatasetLayer
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
        <MapFileLayer
            v-else
            :layer="data"
            :zIndex="index"
            @update="updateMapLayerData(index, $event)"
            @remove="removeLayerData(index)"
        />
    </div>
</template>
