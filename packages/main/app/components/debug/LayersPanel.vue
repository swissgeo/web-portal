<script lang="ts" setup>
import type { Feature as OGCFeature } from '@swissgeo/shared/ogc'

import { makeServerLayer, useLayerStore, LayerType } from '@swissgeo/layers'
import { IconButton } from '@swissgeo/skeleton'

const isLayersPanelOpen = ref(false)
const filterTerm = ref<string>('')

const layerStore = useLayerStore()

const { features: recordLayers } = await $fetch('/api/v1/layers/records')

const availableLayers = computed(() => {
    const vtLayer: OGCFeature = {
        geocatId: '',
        id: 'ch.swisstopo.leichte-basiskarte.vt',
        language: {
            code: 'en',
            dir: 'ltr',
            name: 'English',
        },
        links: [
            {
                protocol: 'OGC:VECTORTILE',
                title: '',
                type: '',
            },
        ],
        // @ts-expect-error Not gonna specify those here ATM
        properties: {},
    }
    recordLayers.unshift(vtLayer)
    return recordLayers
})

const filteredAvailableLayers = computed(() => {
    if (filterTerm.value === '') {
        return availableLayers.value
    }
    return availableLayers.value.filter((layer) => layer.id.includes(filterTerm.value))
})

onMounted(() => {
    const layer: OGCFeature = {
        geocatId: '',
        id: 'ch.swisstopo.pixelkarte-farbe',
        language: {
            code: 'en',
            dir: 'ltr',
            name: 'English',
        },
        links: [
            {
                protocol: 'OGC:WMTS',
                href: 'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml?lang=de',
                title: 'WMTS',
                type: 'image/png',
            },
        ],
        properties: {
            attribution: '',
            contacts: [],
            description: '',
            title: '',
            type: '',
        },
    }
    layerStore.setBackground(makeServerLayer(LayerType.WMTS, layer, { zIndex: 0 }))
})

/**
 * Extract the layer type from the links
 *
 * Whatever is found first (WMTS or WMS) defines the layer type!
 *
 * @param layer
 */
function getLayerTypeFromFirstServiceLink(layer: OGCFeature) {
    if (!layer.links) {
        throw new Error(`${JSON.stringify(layer)} has no links`)
    }
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

        if (link.protocol === 'OGC:VECTORTILE') {
            return LayerType.VECTOR
        }
    }
    return null
}

function addLayerToMap(layer: OGCFeature) {
    const type = getLayerTypeFromFirstServiceLink(layer)
    if (!type) {
        throw Error('Neither OGC:WMS nor OGC:WMTS found in the definition')
    }
    layerStore.addLayer(makeServerLayer(type, layer))
}

const layerBg = (layer: OGCFeature) => {
    switch (getLayerTypeFromFirstServiceLink(layer)) {
        case LayerType.WMS:
            return 'bg-amber-200'
        case LayerType.WMTS:
            return 'bg-fuchsia-200'
        case LayerType.GEOJSON:
            return 'bg-rose-200'
        case LayerType.VECTOR:
            return 'bg-slate-200'
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
