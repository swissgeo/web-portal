<script setup lang="ts">
import type { Dataset, DistributionCollection } from '@swissgeo/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { useStorage } from '@vueuse/core'

const layerStore = useLayerStore()
const { locale } = useI18n()

const { layer } = defineProps<{
    layer: Dataset
}>()

/**
 * Since we're making 900+ requests to the server to populate this list we store the values in
 * localStorage. In order to update them from time to time, we update the entry when the value is
 * hovered
 */
const state = useStorage(`debug:layers-panel:distribution:${layer.id}:${locale.value}`, {
    distributionData: null,
} as {
    distributionData: DistributionCollection | null
})

const localizedLayer = computed<Dataset>(() => {
    const currentLocale = locale.value
    const existingLanguage = layer.properties?.language

    return {
        ...layer,
        properties: {
            ...layer.properties,
            language: {
                code: currentLocale,
                dir: existingLanguage?.dir ?? 'ltr',
                name: existingLanguage?.name ?? currentLocale,
            },
        },
    }
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

const layerBgMap: Record<string, string> = {
    wms: 'bg-amber-200',
    wmts: 'bg-fuchsia-200',
    geojson: 'bg-rose-200',
    vector: 'bg-slate-200',
}

const layerBg = computed(() => {
    return layerBgMap[type.value] ?? ''
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
        const protocol = record.properties?.protocol

        if (protocol === 'OGC:WMTS') {
            return 'wmts'
        } else if (protocol === 'OGC:WMS') {
            return 'wms'
        } else if (protocol === 'OGC:GeoJSON') {
            return 'geojson'
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
    const distributionDataUpdate = await $fetch<DistributionCollection>(distributionLink.value.href)

    if (distributionDataUpdate) {
        state.value.distributionData = distributionDataUpdate
    }
}

function addLayerToMap() {
    if (!type.value) {
        throw Error('Neither OGC:WMS nor OGC:WMTS found in the definition')
    }
    if (type.value !== 'UNKNOWN') {
        layerStore.addLayer(makeServerLayer(type.value, localizedLayer.value))
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
