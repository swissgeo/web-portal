<script lang="ts" setup>
import type { Dataset } from '@swissgeo/ogc'

import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import { IconButton } from '@swissgeo/skeleton'

const filterTerm = ref<string>('')
const { data: recordLayers } = await useOgcDatasetCollection()

const layerStore = useLayerStore()

const availableLayers = computed(() => {
    // const vtLayer: OGCFeature = {
    //     id: 'VECTOR TEST',
    //     links: [],
    // }
    // recordLayers.value!.features.unshift(vtLayer)
    return recordLayers.value
})

const filteredAvailableLayers = computed((): Dataset[] => {
    if (!availableLayers.value) {
        return []
    }

    if (filterTerm.value === '') {
        return availableLayers.value.records
    }
    return availableLayers.value.records.filter((layer: Dataset) =>
        layer.id.includes(filterTerm.value)
    )
})

function toggleVectorLayer() {
    layerStore.addLayer(
        makeServerLayer({
            id: 'ch.swisstopouseLayerStore.vector',
            links: [],
            properties: {
                title: 'Vector Test',
                type: 'Dataset',
            },
        })
    )
}
</script>

<template>
    <div>
        <div class="absolute flex w-full items-center justify-between gap-4 px-2">
            <input
                v-model="filterTerm"
                class="w-full border border-gray-200 px-2 py-1"
                placeholder="Filter"
                autofocus
            />
            <IconButton
                @click="$emit('close')"
                iconName="X"
            >
            </IconButton>
        </div>
        <div class="mt-12 h-75 overflow-scroll pb-18">
            <table class="">
                <thead>
                    <tr class="border-b">
                        <!-- we're not getting this via API yet-->
                        <td class="pb-2">
                            <button @click="toggleVectorLayer">VECTOR TEST</button>
                        </td>
                        <td class="bg-slate-200 pb-2">vector</td>
                    </tr>
                </thead>
                <DebugLayersPanelEntry
                    :dataset="layer"
                    v-for="layer in filteredAvailableLayers"
                    :key="layer.id"
                />
            </table>
        </div>
    </div>
</template>
