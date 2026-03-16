<script lang="ts" setup>
import type { Layer as BaseLayer, DatasetLayer, Dimension } from '@swissgeo/layers'
import type { MapLayerRenderer, Layer as MapLayer } from '@swissgeo/map'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { makeServerLayer, useLayerStore, isDatasetLayer } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { MapModule } from '@swissgeo/map'

import { projectLayersForMap } from '@/utils/layerOrder'

const layerStore = useLayerStore()
const mapViewStore = useMapViewStore()
const { locale } = useI18n()

const backgroundLayer = ref<DatasetLayer | null>(null)

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
const storeDatasetLayers = computed(() => {
    return layerStore.layers.filter((layer) => isDatasetLayer(layer))
})

const storeFileLayers = computed(() => {
    return layerStore.layers.filter((layer) => !isDatasetLayer(layer))
})

function updateStoreLayerData(layerUuid: string, dataset: Dataset) {
    layerStore.setLayerData(layerUuid, dataset)
}

// function isLayerLocalizedForCurrentLocale(
//     layer: Layer,
//     currentLocale: string | null | undefined
// ): boolean {
//     const layerLanguage = (layer.data! as Dataset).properties?.language?.code

//     // Layers without language metadata are treated as locale-neutral.
//     if (!layerLanguage) {
//         return true
//     }

//     return normalizeLanguageCode(layerLanguage) === normalizeLanguageCode(currentLocale)
// }

// const canRenderDatasetLayersForLocale = computed(() => {
//     return (
//         normalizeLanguageCode(ogcDatasetCollectionStore.currentLanguage) ===
//         normalizeLanguageCode(locale.value)
//     )
// })

// const localizedDatasetLayers = computed(() => {
//     if (!canRenderDatasetLayersForLocale.value) {
//         return []
//     }

//     return storeDatasetLayers.value.filter((layer) =>
//         isLayerLocalizedForCurrentLocale(layer, locale.value)
//     )
// })

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
    }
}

function removeBackgroundLayerData() {
    backgroundLayerMapData.value = null
}

function updateLayerInfo(layerUuid: string, info: LayerInfo) {
    layerStore.setLayerInfo(layerUuid, info)
}

onMounted(() => {
    console.log('remounting Map page')
})
</script>

<template>
    <NuxtLayout>
        <ClientOnly>
            <MapDatamappingFileLayer
                v-for="layer in storeFileLayers"
                :layer="layer"
                :key="layer.uuid"
                :zIndex="layerStore.getLayerZIndex(layer.uuid)"
                @update="updateMapLayerData(layer.uuid, $event)"
                @remove="removeLayerData(layer.uuid)"
            ></MapDatamappingFileLayer>
            <MapDatamappingDatasetLayer
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
            ></MapDatamappingDatasetLayer>

            <!-- Mapping the background layer -->
            <MapDatamappingDatasetLayer
                v-if="layerStore.backgroundLayer && isDatasetLayer(layerStore.backgroundLayer)"
                :key="layerStore.backgroundLayer.uuid"
                :layer="layerStore.backgroundLayer"
                @update="backgroundLayerMapData = $event"
                :zIndex="-1"
                @remove="removeBackgroundLayerData"
            ></MapDatamappingDatasetLayer>

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

            <!-- <MapBackgroundSelector
            :currentBackground="layerStore.backgroundLayer"
            @setBackground="changeBackground"
        /> -->
            <MapTimeSliderButton />
        </ClientOnly>
    </NuxtLayout>
</template>
