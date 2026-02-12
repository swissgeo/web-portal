<script lang="ts" setup>
import { useLayerStore } from '@swissgeo/layers'
import { MapModule } from '@swissgeo/map'

const layerStore = useLayerStore()
</script>

<template>
    <ClientOnly>
        <MapModule
            :layers="layerStore.layers"
            :background-layer="layerStore.backgroundLayer"
            :visible-layers="layerStore.visibleLayers"
            class="h-screen w-full"
        />
        <Toolbox />
        <DebugPanel class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"></DebugPanel>

        <MapBackgroundSelector />
        <MapTimeSliderButton />
    </ClientOnly>
</template>
