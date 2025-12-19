<script lang="ts" setup>
import { useLayerStore } from '@swissgeo/layers'
import { cloneDeep } from 'lodash-es'

import LayerCartEntry from './LayerCartEntry.vue'

const layerStore = useLayerStore()

const sortedLayers = computed(() => {
    // sort is in-place, this would trigger a reactivity loop of death
    return cloneDeep(layerStore.layers)
        .sort((a, b) => a.zIndex - b.zIndex)
        .reverse()
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
