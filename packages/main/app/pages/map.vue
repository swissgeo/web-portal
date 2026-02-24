<script lang="ts" setup>
import type { MapLayerRenderer } from '@swissgeo/map'

import { OpenLayersDrawingLayer, isDrawingLayer } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'
import { MapModule } from '@swissgeo/map'

const layerStore = useLayerStore()

const customLayerRenderers: MapLayerRenderer[] = [
    {
        matches: isDrawingLayer,
        component: OpenLayersDrawingLayer,
    },
]
</script>

<template>
    <ClientOnly>
        <MapModule
            :layers="layerStore.layers"
            :background-layer="layerStore.backgroundLayer"
            :custom-layer-renderers="customLayerRenderers"
            class="h-screen w-full"
        />
        <Toolbox />
        <DebugPanel class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"></DebugPanel>

        <MapBackgroundSelector />
        <MapTimeSliderButton />
    </ClientOnly>
</template>
