<script setup lang="ts">
import type { Dimension, Layer } from '@swissgeo/layers'

import { useLayerStore } from '@swissgeo/layers'
import { TimeSlider } from '@swissgeo/timeslider'
import type { LayerWithTime } from '@swissgeo/timeslider'

const mapViewStore = useMapViewStore()
const layerStore = useLayerStore()

const timeLayers = computed((): LayerWithTime[] =>
    layerStore.layers.filter(
        (layer: Layer) => layer.dimensions && 'time' in layer.dimensions
    ) as LayerWithTime[]
)

function onClose() {
    mapViewStore.closeTimeSlider()
}

function onUpdateDimension({
    uuid,
    key,
    dimension,
}: {
    uuid: string
    key: string
    dimension: Partial<Dimension>
}) {
    layerStore.setDimension(key, uuid, dimension)
}

function onUpdateVisibility({ uuid, isVisible }: { uuid: string; isVisible: boolean }) {
    const layer = layerStore.layers.find((l) => l.uuid === uuid)
    if (layer) {
        layer.isVisible = isVisible
    }
}
</script>

<template>
    <div
        v-if="mapViewStore.isTimeSliderVisible"
        class="fixed top-4 right-24 left-[420px] z-50"
    >
        <TimeSlider
            :layers="timeLayers"
            @close="onClose"
            @update-dimension="onUpdateDimension"
            @update-visibility="onUpdateVisibility"
        />
    </div>
</template>
