<script setup lang="ts">
import type Map from 'ol/Map'
import type { Raw } from 'vue'

import proj4 from 'proj4'
import Overlay from 'ol/Overlay'
import { computed, inject, onBeforeUnmount, onMounted, watch } from 'vue'

import type { GetPointBeingHoveredFunction } from '@/components/ElevationProfilePlot.vue'

const LV95_EPSG = 'EPSG:2056'

const { olInstance, mapProjection } = defineProps<{
    olInstance: Raw<Map>
    mapProjection?: string
}>()

const getPointBeingHovered = inject<GetPointBeingHoveredFunction>('getPointBeingHovered')

const coordinate = computed(() => {
    const lv95Coord = getPointBeingHovered?.()?.coordinate
    if (!lv95Coord) {
        return undefined
    }
    if (!mapProjection || mapProjection === LV95_EPSG) {
        return lv95Coord
    }
    return proj4(LV95_EPSG, mapProjection, lv95Coord) as [number, number]
})

const markerElement = document.createElement('div')
markerElement.style.cssText =
    'width:20px;height:20px;border-radius:50%;border:3px solid #dc2626;background:rgba(239,68,68,0.75);pointer-events:none;'

const currentHoverPosOverlay = new Overlay({
    element: markerElement,
    positioning: 'center-center',
    stopEvent: false,
})

onMounted(() => {
    olInstance.addOverlay(currentHoverPosOverlay)
})

onBeforeUnmount(() => {
    olInstance.removeOverlay(currentHoverPosOverlay)
})

watch(coordinate, (val) => {
    currentHoverPosOverlay.setPosition(val)
})
</script>

<template>
    <slot />
</template>
