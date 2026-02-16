<script setup lang="ts">
import type { DatasetLayer, Layer } from '@swissgeo/layers'
import type { OGCRecord } from '@swissgeo/shared/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
//import type { ActionDispatcher } from '@/stores/types'
//import BackgroundSelectorWheelRounded from '@/modules/map/components/footer/backgroundSelector/BackgroundSelectorWheelRounded.vue'
import { computedAsync } from '@vueuse/core'

import type { VoidLayer } from './useBackgroundSelector'

// import useUIStore from '@/stores/ui'
// const dispatcher: ActionDispatcher = { name: 'BackgroundSelector.vue' }
import { AVAILABLE_BACKGROUNDS } from './constants'

const layerStore = useLayerStore()
const runtimeConfig = useRuntimeConfig()

const backgroundRecords = computed(async () => {
    const promises: Promise<OGCRecord>[] = []
    for (const backgroundId of AVAILABLE_BACKGROUNDS) {
        promises.push($fetch(`${runtimeConfig.public.ogcApiEndpoint}/items/${backgroundId}`))
    }

    const values = await Promise.all(promises)

    return values.map((record: OGCRecord) => {
        return makeServerLayer('wmts', record, {
            zIndex: 0,
        })
    })
})

const sortedBackgroundLayersWithVoid = computedAsync<(DatasetLayer | VoidLayer)[]>(
    async () => ['void', ...(await backgroundRecords.value)],
    ['void']
)

onMounted(() => {
    layerStore.setBackground('void')
})

watch(
    sortedBackgroundLayersWithVoid,
    (backgrounds) => {
        // as soon as the layer data is ready for the backgrounds, select
        // pixelkarte-farbe
        layerStore.setBackground(backgrounds[2])
    },
    { once: true }
)

function selectBackground(backgroundLayer: Layer | VoidLayer) {
    if (backgroundLayer === 'void') {
        layerStore.setBackground(null)
    }
    layerStore.setBackground(backgroundLayer /*, dispatcher*/)
}
</script>

<template>
    <MapBackgroundSelectorSquared
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layerStore.backgroundLayer ?? 'void'"
        @select-background="selectBackground"
    />
    <!-- <BackgroundSelectorWheelRounded
        v-else
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layersStore.currentBackgroundLayer"
        @select-background="selectBackground"
    /> -->
</template>
