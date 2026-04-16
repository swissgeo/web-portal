<script setup lang="ts">
import type { Dataset } from '@swissgeo/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'

const layerStore = useLayerStore()

const { dataset } = defineProps<{
    dataset: Dataset
}>()

const layerBgMap: Record<string, string> = {
    wms: 'bg-amber-200',
    wmts: 'bg-fuchsia-200',
    geojson: 'bg-rose-200',
}

const layerBg = computed(() => {
    return layerBgMap[type.value] ?? ''
})

/**
 * Extract the layer type from the preferred layer type
 */
const type = computed((): 'wmts' | 'wms' | 'UNKNOWN' => {
    if (dataset.properties.preferredDistributionId) {
        const protocol = dataset.properties.preferredDistributionId.split(':')[1]
        if (protocol?.toLowerCase()) {
            return protocol as 'wmts' | 'wms'
        }
    }

    return 'UNKNOWN'
})

function addLayerToMap() {
    if (!type.value) {
        throw Error('Neither OGC:WMS nor OGC:WMTS found in the definition')
    }
    if (type.value !== 'UNKNOWN') {
        layerStore.addLayer(makeServerLayer(dataset))
    }
}
</script>

<template>
    <tr class="hover:bg-cyan-300">
        <td class="border-b pb-2">
            <button
                class="cursor-pointer"
                @click="addLayerToMap()"
            >
                {{ dataset.id }}
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
