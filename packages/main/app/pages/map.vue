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
            class="h-screen w-full"
        />
        <DebugPanel class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"></DebugPanel>

        <MapBackgroundSelector />
    </ClientOnly>
</template>
