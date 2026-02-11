<script setup lang="ts">
import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
import { IconButton } from '@swissgeo/skeleton'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'

const layerStore = useLayerStore()

// Example URLs:
// WMTS: https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml
// WMS: https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0
const importUrl = ref('https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml')
const layers: Ref<string[]> = ref([])
const currentLayerType: Ref<LayerType | null> = ref(null)

const encodedUrl = computed(() => encodeURIComponent(importUrl.value))

async function doIt() {
    if (importUrl.value.toLowerCase().includes('wmts')) {
        // do wmts
        const data = await $fetch(importUrl.value)
        extractWmtsLayers(data)
        currentLayerType.value = LayerType.WMTS
    } else if (importUrl.value.toLowerCase().includes('wms')) {
        // do wms
        const data = await $fetch(importUrl.value)
        extractWmsLayers(data)
        currentLayerType.value = LayerType.WMS
    }
}

function extractWmtsLayers(capaData: string) {
    const wmtsParser = new WMTSCapabilities()
    const capabilities = wmtsParser.read(capaData)
    const layerList = capabilities.Contents.Layer

    layers.value = layerList.map((layer) => layer.Identifier)
}

function extractWmsLayers(capaData: string) {
    const wmsParser = new WMSCapabilities()
    const capabilities = wmsParser.read(capaData)
    const layerList = capabilities.Capability.Layer.Layer

    layers.value = layerList.map((layer) => layer.Name)
}

function addLayer(layer: string) {
    const capaUrl = new URL(importUrl.value)

    const fakeDataset = {
        id: layer,
        links: [
            {
                href: `/api/v1/layers/external/${encodedUrl.value}/${layer}`,
                rel: 'distributions',
                title: 'Distributions',
                type: 'application/json',
            },
        ],
        properties: {
            title: `${layer} on ${capaUrl.hostname}`,
            type: 'Dataset',
        },
    }

    const layerType = currentLayerType.value || LayerType.WMTS
    layerStore.addLayer(makeServerLayer(layerType, fakeDataset))
}
</script>

<template>
    <div>
        <div class="absolute flex w-full items-center justify-between gap-4 px-2">
            <input
                v-model="importUrl"
                class="w-full border border-gray-200 px-2 py-1"
                placeholder="Capability URL"
                @keydown.enter="doIt"
            />
            <IconButton
                @click="doIt"
                icon="Send"
            ></IconButton>
            <IconButton
                @click="$emit('close')"
                icon="X"
            >
            </IconButton>
        </div>
        <div class="mt-12 h-[300px] overflow-scroll pb-18">
            <ul>
                <li
                    v-for="layer in layers"
                    :key="layer"
                    class="py-2"
                >
                    <button
                        class="cursor-pointer hover:bg-cyan-200"
                        @click="addLayer(layer)"
                    >
                        {{ layer }}
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>
