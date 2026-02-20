<script setup lang="ts">
import type { DatasetLayer, Layer } from '@swissgeo/layers'
import type { Dataset } from '@swissgeo/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
import { computedAsync } from '@vueuse/core'

import type { VoidLayer } from './useBackgroundSelector'

import { AVAILABLE_BACKGROUNDS } from './constants'

const layerStore = useLayerStore()
const runtimeConfig = useRuntimeConfig()

const backgroundRecords = computed(async () => {
    const promises: Promise<Dataset>[] = []
    for (const backgroundId of AVAILABLE_BACKGROUNDS) {
        promises.push($fetch(`${runtimeConfig.public.ogcApiEndpoint}/items/${backgroundId}`))
    }

    const values = await Promise.all(promises)

    return values.map((record: Dataset) => {
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
    <!-- Desktop (sm+): rectangular buttons spread to the left, fixed bottom-right -->
    <MapBackgroundSelectorSquared
        class="max-sm:hidden"
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layerStore.backgroundLayer ?? 'void'"
        @select-background="selectBackground"
    />
    <!-- Mobile (below sm): circular buttons spread upward, fixed bottom-left -->
    <MapBackgroundSelectorRounded
        class="sm:hidden"
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layerStore.backgroundLayer ?? 'void'"
        @select-background="selectBackground"
    />
</template>
