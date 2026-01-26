<script lang="ts" setup>
import { MapModule } from '@swissgeo/map'
// import { useDrawingManager } from '~/composables/useDrawingManager'

// Provide the drawing manager to all child components (including the map)
const drawingManager = useDrawingManager()
provide('drawingManager', drawingManager)
</script>

<template>
    <ClientOnly>
        <MapModule class="h-screen w-full" />
        <DebugPanel class="fixed right-[50%] bottom-0 z-3 translate-x-[50%]"></DebugPanel>
    </ClientOnly>
</template>
