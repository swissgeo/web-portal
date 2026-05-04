<script setup lang="ts">
import type Map from 'ol/Map'
import type { Raw } from 'vue'

import { LV95 } from '@swissgeo/coordinates'
import Overlay from 'ol/Overlay'
import proj4 from 'proj4'
import { computed, inject, onBeforeUnmount, onMounted, watch } from 'vue'

import type { GetPointBeingHoveredFunction } from '@/components/ElevationProfilePlot.vue'

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
    if (!mapProjection || mapProjection === LV95.epsg) {
        return lv95Coord
    }
    return proj4(LV95.epsg, mapProjection, lv95Coord) as [number, number]
})

let currentHoverPosOverlay: Overlay | undefined

onMounted(() => {
    const markerElement = document.createElement('div')
    markerElement.style.cssText =
        'width:20px;height:20px;border-radius:50%;border:3px solid #dc2626;background:rgba(239,68,68,0.75);pointer-events:none;'
    currentHoverPosOverlay = new Overlay({
        element: markerElement,
        positioning: 'center-center',
        stopEvent: false,
    })
    olInstance.addOverlay(currentHoverPosOverlay)
})

onBeforeUnmount(() => {
    if (currentHoverPosOverlay) {
        olInstance.removeOverlay(currentHoverPosOverlay)
    }
})

watch(coordinate, (val) => {
    currentHoverPosOverlay?.setPosition(val)
})
</script>

<template>
    <slot />
</template>
