<script setup lang="ts">
import { computed } from 'vue'

import type { AttributionSource, Layer } from '@/types/layers'

const { layers, backgroundLayer } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer | null
}>()

const sources = computed((): AttributionSource[] => {
    const visibleLayers = layers.filter((layer) => layer.isVisible)

    const attributedLayers: Layer[] = []

    if (backgroundLayer?.isVisible && backgroundLayer.info?.attribution?.title) {
        attributedLayers.push(backgroundLayer)
    }

    attributedLayers.push(...visibleLayers.filter((layer) => !!layer.info?.attribution?.title))

    return attributedLayers
        .map((layer) => {
            const title = layer.info?.attribution?.title
            if (!title) {
                return null
            }
            const source: AttributionSource = {
                id: title.replace(/[._]/g, '-'),
                name: title,
                url: layer.info?.attribution?.url,
            }
            return source
        })
        .filter((source): source is AttributionSource => source !== null)
        .filter((source, index, array) => array.findIndex((s) => s.name === source.name) === index)
})
</script>

<template>
    <slot :sources="sources" />
</template>
