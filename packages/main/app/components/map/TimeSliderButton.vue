<script setup lang="ts">
import type { Dimension, Layer } from '@swissgeo/layers'
import type { LayerWithTime } from '@swissgeo/timeslider'

import { useLayerStore } from '@swissgeo/layers'
import { useSidebarStore } from '@swissgeo/skeleton'
import { TimeSlider } from '@swissgeo/timeslider'

const mapViewStore = useMapViewStore()
const layerStore = useLayerStore()
const sidebarStore = useSidebarStore()

function isLayerWithTime(layer: Layer): layer is LayerWithTime {
    return !!layer.dimensions && 'time' in layer.dimensions && !!layer.dimensions.time
}

const timeLayers = computed((): LayerWithTime[] =>
    layerStore.layers.filter<LayerWithTime>(isLayerWithTime)
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
    layerStore.setDimension(key as 'time', uuid, dimension)
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
        class="fixed top-4 right-24 z-50"
        :style="{ left: sidebarStore.sidebarWidth + 8 + 'px' }"
    >
        <TimeSlider
            :layers="timeLayers"
            @close="onClose"
            @update-dimension="onUpdateDimension"
            @update-visibility="onUpdateVisibility"
        />
    </div>
</template>
