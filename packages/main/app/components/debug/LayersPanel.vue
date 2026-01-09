<script lang="ts" setup>
import type { Feature as OGCFeature, OGCRecords } from '@swissgeo/shared/ogc'

import { IconButton } from '@swissgeo/skeleton'

import LayersPanelEntry from './LayersPanelEntry.vue'

const isLayersPanelOpen = ref(false)
const filterTerm = ref<string>('')

const { data: recordLayers } = await useFetch<OGCRecords>('/api/v1/layers/catalog')

const availableLayers = computed(() => {
    const vtLayer: OGCFeature = {
        id: 'ch.swisstopo.leichte-basiskarte.vt',
        links: [],
    }
    recordLayers.value!.features.unshift(vtLayer)
    return recordLayers.value
})

const filteredAvailableLayers = computed((): OGCFeature[] => {
    if (!availableLayers.value) {
        return []
    }

    if (filterTerm.value === '') {
        return availableLayers.value.features
    }
    return availableLayers.value.features.filter((layer) => layer.id.includes(filterTerm.value))
})

// const setDefaultBackground = () => {
//     const layer =
//     layerStore.setBackground(makeServerLayer(LayerType.WMTS, layer, { zIndex: 0 }))
// }

onMounted(() => {
    //setDefaultBackground()
})

function toggleLayersPanel() {
    isLayersPanelOpen.value = !isLayersPanelOpen.value
}
</script>

<template>
    <div>
        <div
            class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
            v-if="isLayersPanelOpen"
        >
            <div class="absolute flex items-center gap-4">
                <input
                    v-model="filterTerm"
                    class="w-full border border-gray-200 px-2 py-1"
                    placeholder="Filter"
                />
                <IconButton
                    @click="toggleLayersPanel"
                    icon="X"
                >
                </IconButton>
            </div>
            <div class="mt-12 h-[300px] overflow-scroll">
                <table class="">
                    <LayersPanelEntry
                        :layer="layer"
                        v-for="layer in filteredAvailableLayers"
                        :key="layer.id"
                    />
                </table>
            </div>
        </div>
        <div
            class=""
            v-if="!isLayersPanelOpen"
        >
            <Button
                @click="toggleLayersPanel"
                class="cursor-pointer"
            >
                Open Layers Panel
            </Button>
        </div>
    </div>
</template>
