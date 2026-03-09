<script lang="ts" setup>
import type { Layer as BaseLayer, DatasetLayer, Dimension, Layer } from '@swissgeo/layers'
import type { MapLayerRenderer, Layer as MapLayer } from '@swissgeo/map'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'
import { MapModule } from '@swissgeo/map'
import { MapDatasetLayer } from '#components'

const layerStore = useLayerStore()

const backgroundLayer = ref<Layer | null>(null)

const backgroundLayerMapData = ref<MapLayer>()
const layersForMap = ref<MapLayer[]>([])

const customLayerRenderers: MapLayerRenderer[] = [
    {
        matches: isDrawingLayer,
        component: OpenLayersDrawingLayer,
    },
]
const isDatasetLayer = (layer: BaseLayer): layer is DatasetLayer =>
    'dataset' in layer && !!layer.dataset

const storeDatasetLayers = computed(() => {
    return layerStore.layers.filter((layer) => isDatasetLayer(layer))
})

const storeFileLayers = computed(() => {
    return layerStore.layers.filter((layer) => !isDatasetLayer(layer))
})

function updateLayerData(index: number, layerData: MapLayer) {
    layersForMap.value[index] = layerData
}

function removeLayerData(index: number) {
    layersForMap.value.splice(index, 1)
}

function updateTimeDimension(layerUuid: string, dimension: Partial<Dimension>) {
    layerStore.setDimension('time', layerUuid, dimension)
}

function changeBackground(layer: Layer | null) {
    backgroundLayer.value = null
    if (layer) {
        backgroundLayer.value = layer
    }
}
</script>

<template>
    <ClientOnly>
        <MapFileLayer
            v-for="(layer, idx) in storeFileLayers"
            :layer="layer"
            :key="layer.uuid"
            :zIndex="layerStore.getLayerZIndex(layer.uuid)"
            @update="updateLayerData(idx, $event)"
            @remove="removeLayerData(idx)"
        ></MapFileLayer>
        <MapDatasetLayer
            v-for="(layer, idx) in storeDatasetLayers"
            :layer="layer"
            :key="layer.uuid"
            :zIndex="layerStore.getLayerZIndex(layer.uuid)"
            @update="updateLayerData(idx, $event)"
            @remove="removeLayerData(idx)"
            @updateTimeDimension="updateTimeDimension"
        ></MapDatasetLayer>

        <!-- Mapping the background layer -->
        <MapDatasetLayer
            v-if="backgroundLayer"
            :key="backgroundLayer.uuid"
            :layer="backgroundLayer as DatasetLayer"
            @update="backgroundLayerMapData = $event"
            :zIndex="0"
        ></MapDatasetLayer>

        <MapModule
            :layers="layersForMap"
            :background-layer="backgroundLayerMapData"
            :custom-layer-renderers="customLayerRenderers"
            class="h-screen w-full"
        />
        <Toolbox />
        <DebugPanel class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"></DebugPanel>
        <DrawingFeatureInfoWindow />

        <MapBackgroundSelector
            :currentBackground="backgroundLayer"
            @setBackground="changeBackground"
        />
        <MapTimeSliderButton />
    </ClientOnly>
</template>
