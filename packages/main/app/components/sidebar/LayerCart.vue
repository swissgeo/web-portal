<script lang="ts" setup>
import type { Layer as MapLayer } from '@swissgeo/map'

import { computed } from 'vue'

import LayerCartEntry from './LayerCartEntry.vue'

const { mapLayers } = defineProps<{
    mapLayers: MapLayer[]
}>()
// slice() creates a copy, which allows us to avoid mutating the original
const sortedLayers = computed(() => mapLayers.slice().reverse())
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
