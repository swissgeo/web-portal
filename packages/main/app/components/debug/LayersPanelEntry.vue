<script setup lang="ts">
import type { Dataset, Distribution } from '@swissgeo/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { useStorage } from '@vueuse/core'

const layerStore = useLayerStore()

const { layer } = defineProps<{
    layer: Dataset
}>()

/**
 * Since we're making 900+ requests to the server to populate this list we store the values in
 * localStorage. In order to update them from time to time, we update the entry when the value is
 * hovered
 */
const state = useStorage(layer.id, {
    distributionData: null,
} as {
    distributionData: Distribution | null
})

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

const layerBg = computed(() => {
    switch (type.value) {
        case 'wms':
            return 'bg-amber-200'
        case 'wmts':
            return 'bg-fuchsia-200'
        case 'geojson':
            return 'bg-rose-200'
        case 'vector':
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
const type = computed((): 'wmts' | 'wms' | 'geojson' | 'vector' | 'UNKNOWN' => {
    if (!state.value.distributionData) {
        return 'UNKNOWN'
    }

    const preferredDistributionId =
        state.value.distributionData.properties?.preferredDistributionId || null

    if (!state.value.distributionData.records) {
        log.error({
            title: 'LayersPanelEntry',
            titleColor: LogPreDefinedColor.Rose,
            messages: [
                `dataset ${state.value.distributionData.id} has no records`,
                state.value.distributionData,
            ],
        })
    }

    for (const record of state.value.distributionData.records) {
        // if there's no preferredDistributionId, I want this to be true
        // so that it will just select the first one it finds
        if (preferredDistributionId === null || record.id === preferredDistributionId) {
            const protocol = record.properties?.protocol

            if (protocol === 'OGC:WMTS') {
                return 'wmts'
            } else if (protocol === 'OGC:WMS') {
                return 'wms'
            } else if (protocol === 'OGC:GeoJSON') {
                return 'geojson'
            }
        }
    }

    return 'UNKNOWN'
})

onMounted(() => {
    if (state.value.distributionData === null) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        updateDistributionData()
    }
})

async function updateDistributionData() {
    const distributionDataUpdate = await $fetch<Distribution>(distributionLink.value.href)

    if (distributionDataUpdate) {
        state.value.distributionData = distributionDataUpdate
    }
}

function addLayerToMap(layer: Dataset) {
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
