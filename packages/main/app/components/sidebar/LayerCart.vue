<script lang="ts" setup>
import { useLayerStore } from '@swissgeo/layers'
import { computed } from 'vue'
import type { Layer as MapLayer } from '@swissgeo/map'

import LayerCartEntry from './LayerCartEntry.vue'

const layerStore = useLayerStore()
const { mapLayers } = defineProps<{
    mapLayers: MapLayer[]
}>()
const sortedLayers = computed(() => mapLayers.reverse())
</script>

<template>
    <ul class="mt-8 flex flex-col gap-4">
        <LayerCartEntry
            v-for="(layer, index) in sortedLayers"
            class="flex items-center gap-2"
            :key="layer.uuid"
            :index="mapLayers.length - 1 - index"
            :layer="layer"
        />
    </ul>
</template>
