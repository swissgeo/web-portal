<script lang="ts" setup>
import type { Layer as BaseLayer, DatasetLayer, Dimension, Layer } from '@swissgeo/layers'
import type { MapLayerRenderer, Layer as MapLayer } from '@swissgeo/map'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { MapModule } from '@swissgeo/map'
import { MapDatasetLayer } from '#components'

import { useOgcDatasetCollectionStore } from '@/stores/ogcDatasetCollection'
import { projectLayersForMap } from '@/utils/layerOrder'

const layerStore = useLayerStore()
const mapViewStore = useMapViewStore()
const { locale } = useI18n()
const ogcDatasetCollectionStore = useOgcDatasetCollectionStore()
const { data: recordLayers } = await useOgcDatasetCollection({ initializeOnUse: false })

const backgroundLayer = ref<Layer | null>(null)

const backgroundLayerMapData = ref<MapLayer>()
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
const isDatasetLayer = (layer: BaseLayer): layer is DatasetLayer =>
    'dataset' in layer && !!layer.dataset

const storeDatasetLayers = computed(() => {
    return layerStore.layers.filter((layer) => isDatasetLayer(layer))
})

watch(
    () => storeDatasetLayers.value.length,
    (datasetLayerCount) => {
        if (datasetLayerCount === 0 || ogcDatasetCollectionStore.initialized) {
            return
        }

        void ogcDatasetCollectionStore.initialize(locale.value)
    },
    { immediate: true }
)

const storeFileLayers = computed(() => {
    return layerStore.layers.filter((layer) => !isDatasetLayer(layer))
})

function updateLayerData(layerUuid: string, layerData: MapLayer) {
    layersByUuid.value[layerUuid] = layerData
}

function removeLayerData(layerUuid: string) {
    delete layersByUuid.value[layerUuid]
}

function updateTimeDimension(layerUuid: string, dimension: Partial<Dimension>) {
    layerStore.setDimension('time', layerUuid, dimension)
}

function changeBackground(layer: Layer | null) {
    log.debug({
        title: 'map',
        titleColor: LogPreDefinedColor.Red,
        messages: ['Changing background from <1> to <2>', backgroundLayer.value, layer],
    })
    backgroundLayer.value = layer
}

function removeBackgroundLayerData() {
    backgroundLayerMapData.value = null
}

function refreshDatasetLayersForLocale() {
    if (!recordLayers.value?.records) {
        return
    }

    const datasetLayers = layerStore.layers.filter((layer) => isDatasetLayer(layer))

    if (datasetLayers.length === 0) {
        return
    }

    const recordsById = new Map(recordLayers.value.records.map((record) => [record.id, record]))

    for (const existingLayer of datasetLayers) {
        const localizedDataset = recordsById.get(existingLayer.dataset.id)

        if (!localizedDataset) {
            continue
        }

        const replacement = makeServerLayer(existingLayer.type, localizedDataset, {
            uuid: existingLayer.uuid,
            isVisible: existingLayer.isVisible,
            opacity: existingLayer.opacity,
            dimensions: existingLayer.dimensions,
        })

        layerStore.replaceLayer(existingLayer.uuid, replacement)
    }
}

watch(
    () => recordLayers.value,
    () => {
        refreshDatasetLayersForLocale()
    }
)
</script>

<template>
    <ClientOnly>
        <MapFileLayer
            v-for="layer in storeFileLayers"
            :layer="layer"
            :key="layer.uuid"
            :zIndex="layerStore.getLayerZIndex(layer.uuid)"
            @update="updateLayerData(layer.uuid, $event)"
            @remove="removeLayerData(layer.uuid)"
        ></MapFileLayer>
        <MapDatasetLayer
            v-for="layer in storeDatasetLayers"
            :layer="layer"
            :key="layer.uuid"
            :zIndex="layerStore.getLayerZIndex(layer.uuid)"
            @update="updateLayerData(layer.uuid, $event)"
            @remove="removeLayerData(layer.uuid)"
            @updateTimeDimension="updateTimeDimension"
        ></MapDatasetLayer>

        <!-- Mapping the background layer -->
        <MapDatasetLayer
            v-if="backgroundLayer"
            :key="backgroundLayer.uuid"
            :layer="backgroundLayer as DatasetLayer"
            @update="backgroundLayerMapData = $event"
            :zIndex="0"
            @remove="removeBackgroundLayerData"
        ></MapDatasetLayer>

        <MapModule
            :layers="layersForMap"
            :background-layer="backgroundLayerMapData"
            :custom-layer-renderers="customLayerRenderers"
            class="h-screen w-full"
        />
        <Toolbox />
        <DebugPanel
            v-if="showAdditionalMapUi"
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
