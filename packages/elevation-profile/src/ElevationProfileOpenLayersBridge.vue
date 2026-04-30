<script setup lang="ts">
import type { SingleCoordinate } from '@swissgeo/coordinates'
import type Map from 'ol/Map'
import type { Raw } from 'vue'

import Overlay from 'ol/Overlay'
import { computed, inject, onBeforeUnmount, onMounted, watch } from 'vue'

import type { GetPointBeingHoveredFunction } from '@/components/ElevationProfilePlot.vue'

const { olInstance } = defineProps<{
    olInstance: Raw<Map>
}>()

const getPointBeingHovered = inject<GetPointBeingHoveredFunction>('getPointBeingHovered')

const coordinate = computed<SingleCoordinate | undefined>(() => {
    return getPointBeingHovered?.()?.coordinate
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
