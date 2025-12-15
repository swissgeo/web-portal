<script lang="ts" setup>
import type { Feature as OGCFeature, Link as OGCLink } from '@swissgeo/shared/ogc'

import { makeLayer, useLayerStore, LayerType } from '@swissgeo/layers'
import { MapModule } from '@swissgeo/map'

const layersStore = useLayerStore()

const { features: availableLayers } = await $fetch('/api/v1/layers/records')

// const availableLayers = ref<OGCFeature[]>([]);

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
</script>

<template>
    <ClientOnly>
        <MapModule class="h-screen w-full" />
        <div class="fixed right-0 bottom-0 z-3 h-[300px] w-[800px] overflow-scroll bg-white shadow">
            <table>
                <tr
                    v-for="layer in availableLayers"
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
                        <em
                            :class="
                                getLayerTypeFromFirstServiceLink(layer) == 'wms'
                                    ? 'bg-amber-200'
                                    : 'bg-fuchsia-200'
                            "
                            >{{ getLayerTypeFromFirstServiceLink(layer) }}</em
                        >
                    </td>
                </tr>
            </table>
        </div>
    </ClientOnly>
</template>
