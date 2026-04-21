<script lang="ts" setup>
import type { Layer as BaseLayer, DatasetLayer, Dimension, LayerInfo } from '@swissgeo/layers'
import type { MapLayerRenderer, Layer as MapLayer } from '@swissgeo/map'
import type { Dataset } from '@swissgeo/ogc'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { useLayerStore, isDatasetLayer } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { MapModule } from '@swissgeo/map'

import { useGeolocationStore } from '@/stores/geolocation'
import { projectLayersForMap } from '@/utils/layerOrder'

const layerStore = useLayerStore()
const mapViewStore = useMapViewStore()
const geolocationStore = useGeolocationStore()

const backgroundLayer = ref<DatasetLayer | null>(null)

const backgroundLayerMapData = ref<MapLayer | null>(null)
const layersByUuid = ref<Record<string, MapLayer>>({})

const layersForMap = computed(() => {
    return projectLayersForMap(layerStore.layers, layersByUuid.value)
})

const showAdditionalMapUi = computed(() => !mapViewStore.isFullscreenModeActive)

const customLayerRenderers: MapLayerRenderer[] = [
    {
        matches: isDrawingLayer,
        component: OpenLayersDrawingLayer,
    },
]
const storeDatasetLayers = computed(() => {
    return layerStore.layers.filter((layer) => isDatasetLayer(layer))
})

const storeFileLayers = computed(() => {
    return layerStore.layers.filter((layer) => !isDatasetLayer(layer))
})

function updateStoreLayerData(layerUuid: string, dataset: Dataset) {
    layerStore.setLayerData(layerUuid, dataset)
}

function updateMapLayerData(layerUuid: string, layerData: MapLayer) {
    layersByUuid.value[layerUuid] = layerData
}

function removeLayerData(layerUuid: string) {
    delete layersByUuid.value[layerUuid]
}

function updateTimeDimension(layerUuid: string, dimension: Partial<Dimension>) {
    layerStore.setDimension('time', layerUuid, dimension)
}

function updateOpacity(layerUuid: string, opacity: number) {
    layerStore.setOpacity(layerUuid, opacity)
}

function changeBackground(layer: BaseLayer | null) {
    log.debug({
        title: 'map',
        titleColor: LogPreDefinedColor.Red,
        messages: ['Changing background from <1> to <2>', backgroundLayer.value, layer],
    })
    if (layer && isDatasetLayer(layer)) {
        backgroundLayer.value = layer
    } else if (layer === null) {
        // the "void" layer
        backgroundLayer.value = null
    }
}

function removeBackgroundLayerData() {
    backgroundLayerMapData.value = null
}

function updateLayerInfo(layerUuid: string, info: LayerInfo) {
    layerStore.setLayerInfo(layerUuid, info)
}

const displayMode = inject<'web' | 'print'>('displayMode')
</script>

<template>
    <ClientOnly>
        <MapDatamappingFileConverter
            v-for="layer in storeFileLayers"
            :layer="layer"
            :key="layer.uuid"
            :zIndex="layerStore.getLayerZIndex(layer.uuid)"
            @update="updateMapLayerData(layer.uuid, $event)"
            @remove="removeLayerData(layer.uuid)"
        ></MapDatamappingFileConverter>
        <MapDatamappingOgcDatasetConverter
            v-for="layer in storeDatasetLayers"
            :layer="layer"
            :key="layer.uuid"
            :zIndex="layerStore.getLayerZIndex(layer.uuid)"
            @update="updateMapLayerData(layer.uuid, $event)"
            @updateLayerInfo="updateLayerInfo"
            @updateOpacity="updateOpacity"
            @remove="removeLayerData(layer.uuid)"
            @updateTimeDimension="updateTimeDimension"
            @updateDataset="updateStoreLayerData"
        ></MapDatamappingOgcDatasetConverter>

        <!-- Mapping the background layer -->
        <MapDatamappingOgcDatasetConverter
            v-if="backgroundLayer"
            :key="backgroundLayer.uuid"
            :layer="backgroundLayer"
            @update="backgroundLayerMapData = $event"
            :zIndex="-1"
            @remove="removeBackgroundLayerData"
        ></MapDatamappingOgcDatasetConverter>

        <MapModule
            :layers="layersForMap"
            :background-layer="backgroundLayerMapData"
            :custom-layer-renderers="customLayerRenderers"
            class="h-full w-full"
        >
            <template #context-menu-popup="{ coordinate, isVisible, close }">
                <MapContextMenuPopup
                    :coordinate="coordinate"
                    :is-visible="isVisible"
                    :close="close"
                />
            </template>
            <MapOpenLayersGeolocationFeedback
                v-if="geolocationStore.active && geolocationStore.position"
            />
        </MapModule>
        <Toolbox
            v-if="displayMode === 'web'"
        />
        <DebugPanel
            v-if="showAdditionalMapUi && displayMode === 'web'"
            class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"
        ></DebugPanel>
        <DrawingFeatureInfoWindow v-if="showAdditionalMapUi" />

        <MapBackgroundSelector
            :currentBackground="backgroundLayer"
            @setBackground="changeBackground"
        />
        <MapTimeSliderButton />
    </ClientOnly>
</template>
