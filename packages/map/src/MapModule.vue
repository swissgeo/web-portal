<script lang="ts" setup>
import type * as OGC from '~~/shared/types/ogc/records.d.ts'

const { layers } = defineProps<{ layers: OGC.Feature[] }>()

const layersToDisplay = computed(() => {
    if (!layers) {
        return []
    }

    const wmtsLayers = layers.filter((layer: OGC.Feature) => {
        const wmts = layer.links.filter((link: OGC.Link) => link.protocol === 'OGC:WMTS')

        return wmts.length > 0
    })

    return [wmtsLayers[0]]
})
</script>

<template>
    <div>
        <!-- here's the switch between openlayers and cesium -->
        <OpenLayersMap :layers="layersToDisplay">
            <slot />
        </OpenLayersMap>
    </div>
</template>
