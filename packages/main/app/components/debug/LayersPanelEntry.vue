<script setup lang="ts">
import type { Feature as OGCFeature, OGCRecords } from '@swissgeo/shared/ogc'

import { makeServerLayer, useLayerStore, LayerType } from '@swissgeo/layers'

const layerStore = useLayerStore()

const { layer } = defineProps<{
    layer: OGCFeature
}>()

const distributionLink = computed(() => {
    if (!layer.links) {
        throw new Error(`${JSON.stringify(layer)} has no links`)
    }
    for (const link of layer.links) {
        if (link.rel === 'distributions') {
            return link
        }
    }
    throw new Error(`Unable to find distribution link for ${layer.id}`)
})

const { data: collectionData } = await useFetch<OGCRecords>(
    `/api/v1/layers/${distributionLink.value.href}`
)

const layerBg = computed(() => {
    switch (type.value) {
        case LayerType.WMS:
            return 'bg-amber-200'
        case LayerType.WMTS:
            return 'bg-fuchsia-200'
        case LayerType.GEOJSON:
            return 'bg-rose-200'
        case LayerType.VECTOR:
            return 'bg-slate-200'
    }
})

/**
 * Extract the layer type from the links
 *
 * Whatever is found first (WMTS or WMS) defines the layer type!
 *
 * @param layer
 */
const type = computed((): LayerType | 'UNKNOWN' => {
    if (!collectionData.value?.features) {
        throw new Error("Unable to find the collection data's features")
    }

    for (const feature of collectionData.value.features) {
        const protocol = feature.properties?.protocol
        // loop through features and the first element found that
        // maches either protocol will determine the layer type

        if (protocol === 'OGC:WMTS') {
            return LayerType.WMTS
        } else if (protocol === 'OGC:WMS') {
            return LayerType.WMS
        }
    }

    return 'UNKNOWN'
})

function addLayerToMap(layer: OGCFeature) {
    if (!type.value) {
        throw Error('Neither OGC:WMS nor OGC:WMTS found in the definition')
    }
    if (type.value !== 'UNKNOWN') {
        layerStore.addLayer(makeServerLayer(type.value, layer))
    }
}
</script>

<template>
    <tr class="hover:bg-cyan-300">
        <td class="border-b pb-2">
            <button
                class="cursor-pointer"
                @click="addLayerToMap(layer)"
            >
                {{ layer.id }}
            </button>
        </td>
        <td
            class="border-b pb-2 hover:bg-inherit"
            :class="layerBg"
        >
            <em>{{ type }}</em>
        </td>
    </tr>
</template>
