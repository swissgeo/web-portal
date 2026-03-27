<script setup lang="ts">
/**
 * Renders a dot marker on the map at the current geolocation position.
 */
import type { Map } from 'ol'
import type { Coordinate } from 'ol/coordinate'
import type { Ref } from 'vue'

import { useAddLayerToMap } from '@swissgeo/map'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Fill, Stroke, Style } from 'ol/style'
import CircleStyle from 'ol/style/Circle'
import { computed, inject, onMounted, shallowRef, watch } from 'vue'

import { useGeolocationStore } from '@/stores/geolocation'

const { zIndex = 52 } = defineProps<{ zIndex?: number }>()

const geolocationStore = useGeolocationStore()
const position = computed(() => geolocationStore.position)

const olMap = inject<Ref<Map | undefined>>('olMap')

const pointFeature = new Feature({
    geometry: new Point((position.value ?? [0, 0]) as Coordinate),
})
pointFeature.setStyle(
    new Style({
        image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: '#1a73e8' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
    })
)

const layer = shallowRef<VectorLayer>(
    new VectorLayer({
        source: new VectorSource({ features: [pointFeature] }),
    })
)

const { addLayerToMap } = useAddLayerToMap(
    layer,
    computed(() => zIndex),
    computed(() => true),
    computed(() => 1),
    olMap
)

onMounted(() => addLayerToMap())

watch(position, (newPosition) => {
    if (newPosition) {
        ;(pointFeature.getGeometry() as Point).setCoordinates(newPosition as Coordinate)
    }
})
</script>

<template>
    <slot />
</template>
