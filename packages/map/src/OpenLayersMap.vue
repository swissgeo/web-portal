<script lang="ts" setup>
import type { Map as OlMapType } from 'ol'

import { registerProj4 } from '@swissgeo/coordinates'
import { useLayerStore } from '@swissgeo/layers'
// import { constants, LV95, WEBMERCATOR } from '@swissgeo/coordinates'
import Map from 'ol/Map'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

import useViewBasedOnProjection from '@/composables/useViewBasedOnProjection.composable'

const layersStore = useLayerStore()

const layers = computed(() => layersStore.layers)

const mapElement = useTemplateRef('mapElement')
const olMap = ref<OlMapType>()

function registerCustomProjection() {
    registerProj4(proj4)
    register(proj4)
}

function createOlMap() {
    const map = new Map({ controls: [] })
    olMap.value = map

    useViewBasedOnProjection(olMap.value)
}

function mountOlMap() {
    if (olMap.value && mapElement.value) {
        olMap.value.setTarget(mapElement.value)
    }
}

provide<Ref<OlMapType | undefined>>('olMap', olMap)

onMounted(() => {
    mountOlMap()
    // make it available for debugging
    window.map = olMap.value
})

registerCustomProjection()
createOlMap()
</script>

<template>
    <div
        ref="mapElement"
        class="ol-map h-full w-full"
        data-cy="ol-map"
        @contextmenu.prevent
    >
        <!-- TODO probably somewhere here there would be the loop?-->
        <OpenLayersVisibleLayer
            :layer="layer"
            v-for="layer in layers"
        />
        <!-- <OpenLayersVisibleLayers />
        <OpenLayersPinnedLocation />
        <OpenLayersCrossHair />
        <OpenLayersHighlightedFeature />
        <OpenLayersGeolocationFeedback v-if="geolocationActive && geoPosition" />
        <OpenLayersRectangleSelectionFeedback /> -->
        <!-- Debug tooling -->
        <!-- <OpenLayersTileDebugInfo
            v-if="showTileDebugInfo"
            :z-index="zIndexTileInfo"
        />
        <OpenLayersLayerExtents
            v-if="showLayerExtents"
            :z-index="zIndexLayerExtents"
        />
        <OpenLayersSelectionRectangle
            v-if="showSelectionRectangle"
            :z-index="zIndexSelectionRectangle"
        /> -->
    </div>
    <!-- So that external modules can have access to the map instance through the provided 'olMap' -->
    <slot />
</template>
