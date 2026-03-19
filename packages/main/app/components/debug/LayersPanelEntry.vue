<script setup lang="ts">
import type { Dataset } from '@swissgeo/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'

const layerStore = useLayerStore()
const { locale } = useI18n()

const { dataset } = defineProps<{
    dataset: Dataset
}>()

const localizedLayer = computed<Dataset>(() => {
    const currentLocale = locale.value
    const existingLanguage = dataset.properties?.language

    return {
        ...dataset,
        properties: {
            ...dataset.properties,
            language: {
                code: currentLocale,
                dir: existingLanguage?.dir ?? 'ltr',
                name: existingLanguage?.name ?? currentLocale,
            },
        },
    }
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
        layerStore.addLayer(makeServerLayer(localizedLayer.value))
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
