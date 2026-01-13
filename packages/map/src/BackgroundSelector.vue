<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'
import type { Feature } from '@swissgeo/shared/ogc'

import { LayerType, makeServerLayer, useLayerStore } from '@swissgeo/layers'
//import type { ActionDispatcher } from '@/store/types'
//import BackgroundSelectorWheelRounded from '@/modules/map/components/footer/backgroundSelector/BackgroundSelectorWheelRounded.vue'
import { computedAsync } from '@vueuse/core'

import type { VoidLayer } from '@/composables/useBackgroundSelector'

// import useUIStore from '@/store/modules/ui'
// const dispatcher: ActionDispatcher = { name: 'BackgroundSelector.vue' }
import BackgroundSelectorSquared from '@/BackgroundSelectorSquared.vue'

const layerStore = useLayerStore()

const AVAILABLE_BACKGROUNDS = [
    // order matters!
    'ch.swisstopo.pixelkarte-grau',
    'ch.swisstopo.pixelkarte-farbe',
    'ch.swisstopo.swissimage',
]

const backgroundRecords = computed(async () => {
    const promises: Promise[] = []
    for (const backgroundId of AVAILABLE_BACKGROUNDS) {
        promises.push($fetch(`/api/v1/layers/collections/swissgeo.catalog/items/${backgroundId}`))
    }

    const values = await Promise.all(promises)

    return values.map((record: Feature) => {
        return makeServerLayer(LayerType.WMTS, record, {
            zIndex: 0,
        })
    })
})

const sortedBackgroundLayersWithVoid = computedAsync<(Layer | VoidLayer)[]>(
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
    // TODO HAAAAACK
    if (backgroundLayer === 'void') {
        layerStore.setBackground(null)
    }
    layerStore.setBackground(backgroundLayer /*, dispatcher*/)
}
</script>

<template>
    <BackgroundSelectorSquared
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layerStore.backgroundLayer"
        @select-background="selectBackground"
    />
    <!-- <BackgroundSelectorWheelRounded
        v-else
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layersStore.currentBackgroundLayer"
        @select-background="selectBackground"
    /> -->
</template>
