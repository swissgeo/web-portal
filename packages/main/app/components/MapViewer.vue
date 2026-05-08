<script lang="ts" setup>
import type { Layer as BaseLayer } from '@swissgeo/layers'
import type { MapLayerRenderer } from '@swissgeo/map'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'
import { MapModule } from '@swissgeo/map'

import SourceToMapDataConverter from '../components/SourceToMapDataConverter.vue'

const geolocationStore = useGeolocationStore()
const layerStore = useLayerStore()
const mapViewStore = useMapViewStore()

const { sources: attributionSources } = useAttributionSources(
    computed(() => layerStore.layers),
    computed(() => layerStore.backgroundLayer)
)

const sourceLayers = computed(() => layerStore.layers)

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
    layerStore.setBackground(layer)
}

// The display mode is defined in the layout
const displayMode = inject<'web' | 'print'>('displayMode', 'web')
</script>

<template>
    <ClientOnly>
        <DrawingFeatureInfoWindow v-if="showAdditionalMapUi" />

        <SourceToMapDataConverter
            :source-bg-layer="backgroundLayer"
            :source-data="sourceLayers"
        />
        <MapModule
            :layers="layersForMap"
            :custom-layer-renderers="customLayerRenderers"
            :display-mode="displayMode"
            class="h-screen w-full"
        >
            <template #context-menu-popup="{ coordinate, isVisible, close }">
                <MapContextMenuPopup
                    :coordinate="coordinate"
                    :is-visible="isVisible"
                    :close="close"
                />
            </template>
            <MapOpenLayersGeolocationFeedback
                v-if="geolocationStore.active && geolocationStore.position && displayMode === 'web'"
            />
            <MapAttributionList
                v-if="displayMode === 'web'"
                :sources="attributionSources"
            />
        </MapModule>
        <Toolbox v-if="displayMode === 'web'" />
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
