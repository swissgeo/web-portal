<script lang="ts" setup>
import { IconButton } from '@swissgeo/skeleton'
import type { Feature as OGCFeature, Link as OGCLink } from '@swissgeo/shared/ogc'
import { makeLayer, useLayerStore, LayerType, type Layer } from '@swissgeo/layers'

const isLayersPanelOpen = ref(true)
const filterTerm = ref<string>('')

const layersStore = useLayerStore()

const { features: availableLayers } = await $fetch('/api/v1/layers/records')

/**
 * Extract the layer type from the links
 *
 * Whatever is found first (WMTS or WMS) defines the layer type!
 *
 * @param layer
 */
function getLayerTypeFromFirstServiceLink(layer: OGCFeature) {
    for (const link of layer.links) {
        if (link.protocol === 'OGC:WMS') {
            return LayerType.WMS
        }

        if (link.protocol === 'OGC:WMTS') {
            return LayerType.WMTS
        }

        if (link.protocol === 'OGC:GEOJSON') {
            return LayerType.GEOJSON
        }
    }
    return null
}

function addLayerToMap(layer: OGCFeature) {
    const type = getLayerTypeFromFirstServiceLink(layer)
    if (!type) {
        throw Error('Neither OGC:WMS nor OGC:WMTS found in the definition')
    }
    layersStore.addLayer(makeLayer(layer, type))
}

const filteredAvailableLayers = computed(() => {
    if (filterTerm.value == '') {
        return availableLayers
    }
    return availableLayers.filter((layer) => layer.id.includes(filterTerm.value))
})

const layerBg = (layer: OGCFeature) => {
    switch (getLayerTypeFromFirstServiceLink(layer)) {
        case 'wms':
            return 'bg-amber-200'
        case 'wmts':
            return 'bg-fuchsia-200'
        case 'geojson':
            return 'bg-rose-200'
    }
}

function toggleLayersPanel() {
    isLayersPanelOpen.value = !isLayersPanelOpen.value
}
</script>

<template>
    <div>
        <div
            class="h-[300px] w-[800px] overflow-scroll bg-white shadow"
            v-if="isLayersPanelOpen"
        >
            <div class="flex items-center gap-4">
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
            <table class="">
                <tr
                    v-for="layer in filteredAvailableLayers"
                    class="hover:bg-cyan-300"
                    :key="layer.geocatId"
                >
                    <td>
                        <button
                            class="cursor-pointer"
                            @click="addLayerToMap(layer)"
                        >
                            {{ layer.id }}
                        </button>
                    </td>
                    <td>
                        <em :class="layerBg(layer)">{{
                            getLayerTypeFromFirstServiceLink(layer)
                        }}</em>
                    </td>
                </tr>
            </table>
        </div>
        <div
            class="fixed right-0 bottom-0"
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
