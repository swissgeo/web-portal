<script lang="ts" setup>
import { useLayerStore } from '@swissgeo/layers'

import LayerCartEntry from './LayerCartEntry.vue'

const layerStore = useLayerStore()

const sortedLayers = computed(() => {
    console.log('Layer store layers: ', layerStore.sortedLayers)
    return layerStore.sortedLayers.reverse()
})
</script>

<template>
    <ul class="mt-8 flex flex-col gap-4">
        <LayerCartEntry
            v-for="layer in sortedLayers"
            class="flex items-center gap-2"
            :key="layer.uuid"
            :layer="layer"
        />
    </ul>
</template>
