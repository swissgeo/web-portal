<script lang="ts" setup>
import type { Map as OlMapType } from 'ol'

// import { constants, LV95, WEBMERCATOR } from '@swissgeo/coordinates'
import { View } from 'ol'
import Map from 'ol/Map'

// TODO
import type * as OGC from '../../../shared/types/ogc/records'

const { layers } = defineProps<{ layers: OGC.Feature[] }>()

const mapElement = useTemplateRef('mapElement')
const olMap = ref<OlMapType>()

function createOlMap() {
    const map = new Map({ controls: [] })
    olMap.value = map

    const view = new View({
        zoom: 1,
        minResolution: 0.1,
        rotation: 0,
        projection: 'epsg:2056',
    })
    map.setView(view)
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
        <OpenLayersBackgroundLayer
            v-if="layers.length"
            :layer-config="layers[0]"
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
