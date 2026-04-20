<script lang="ts" setup>
import type { Layer as BaseLayer } from '@swissgeo/layers'
import type { MapLayerRenderer } from '@swissgeo/map'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'
import { MapModule } from '@swissgeo/map'

import SourceToMapDataConverter from '../components/SourceToMapDataConverter.vue'

const layerStore = useLayerStore()
const mapViewStore = useMapViewStore()

const backgroundLayer = computed(() => layerStore.backgroundLayer)

const layersForMap = computed(() => {
    return mapViewStore.getMapLayers().value
})

const showAdditionalMapUi = computed(() => !mapViewStore.isFullscreenModeActive)

const customLayerRenderers: MapLayerRenderer[] = [
    {
        matches: isDrawingLayer,
        component: OpenLayersDrawingLayer,
    },
]

function changeBackground(layer: BaseLayer | null) {
    // TODO: have a setter rather than a direct access
    layerStore.backgroundLayer = layer
}
</script>

<template>
    <NuxtLayout>
        <MapViewer />
    </NuxtLayout>
    <!-- TODO : move everything under here and in the script to the `MapViewer` component-->
    <ClientOnly>
        <SourceToMapDataConverter
            :source-bg-layer="backgroundLayer"
            :source-data="layerStore.layers"
        />
        <MapModule
            :layers="layersForMap"
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
