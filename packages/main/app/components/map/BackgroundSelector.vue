<script setup lang="ts">
import type { Layer } from '@swissgeo/layers'
import type { Dataset } from '@swissgeo/ogc'

import { makeServerLayer, useLayerStore } from '@swissgeo/layers'
import { computedAsync } from '@vueuse/core'

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
        return makeServerLayer('wmts', record)
    })
})

const sortedBackgroundLayersWithNull = computedAsync<(Layer | null)[]>(
    async () => [null, ...(await backgroundRecords.value)],
    [null]
)

onMounted(() => {
    layerStore.setBackground(null)
})

watch(
    sortedBackgroundLayersWithNull,
    (backgrounds) => {
        // as soon as the layer data is ready for the backgrounds, select
        // pixelkarte-farbe
        const defaultBackgroundId = AVAILABLE_BACKGROUNDS[1]
        const defaultBackground = backgrounds.find((background): background is Layer => {
            return background?.dataset?.id === defaultBackgroundId
        })

        const fallbackBackground = backgrounds.find((background): background is Layer => {
            return background !== null
        })
        layerStore.setBackground(defaultBackground ?? fallbackBackground ?? null)
    },
    { once: true }
)

function selectBackground(backgroundLayer: Layer | null) {
    layerStore.setBackground(backgroundLayer /*, dispatcher*/)
}
</script>

<template>
    <!-- Desktop (sm+): rectangular buttons spread to the left, fixed bottom-right -->
    <MapBackgroundSelectorSquared
        class="max-sm:hidden"
        :background-layers="sortedBackgroundLayersWithNull"
        :current-background-layer="layerStore.backgroundLayer"
        @select-background="selectBackground"
    />
    <!-- Mobile (below sm): circular buttons spread upward, fixed bottom-left -->
    <MapBackgroundSelectorRounded
        class="sm:hidden"
        :background-layers="sortedBackgroundLayersWithNull"
        :current-background-layer="layerStore.backgroundLayer"
        @select-background="selectBackground"
    />
</template>
