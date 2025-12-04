<script lang="ts" setup>
import type { Map as OlMapType } from 'ol'
import type { Options } from 'ol/source/WMTS'

import { Tile as TileLayer } from 'ol/layer'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'

import useAddLayerToMap from '@/useAddLayerToMap.composable'

import type * as OGC from '../../../shared/types/ogc/records'

const { layerConfig, zIndex } = defineProps<{ layerConfig: OGC.Feature; zIndex: number }>()

// grabbing the map from the main OpenLayersMap component and use the composable that adds this layer to the map
const olMap = inject('olMap')
if (!olMap) {
    // log.error('OpenLayersMap is not available')
    throw new Error('OpenLayersMap is not available')
}

const wmtsTimeConfig = computed(() => {
    return { dimensions: { Time: 'current' } }
})

const wmtsSourceConfig = computed(
    (): Options => ({
        cacheSize: 0,
        layer: layerConfig.id,
        style: 'default',
        format: 'png',
        matrixSet: 'EPSG:2056',
        projection: 'EPSG:2056',
        url: getTransformedXYZUrl(),
        tileGrid: createTileGridForProjection(),
        zDirection: 0, //mapStore.printMode ? -1 : 0,
        requestEncoding: 'REST',
        ...wmtsTimeConfig.value,
    })
)

const wmtsLayerConfig = computed(() => ({
    technicalName: layerConfig.id,
    uuid: layerConfig.geocatId,
}))

// const wmtsSourceConfig = computed(() => {
//     return {
//         // No local cache, so that our CloudFront cache is always used. Was creating an issue on mf-geoadmin3, see :
//         // https://github.com/geoadmin/mf-geoadmin3/issues/3491
//         cacheSize: 0,
//         layer: wmtsLayerConfig.technicalName ?? '',
//         format: wmtsLayerConfig.format,
//         projection: positionStore.projection.epsg,
//         // tileGrid: createTileGridForProjection(),
//         // url: getTransformedXYZUrl(wmtsLayerConfig, positionStore.projection, true),
//         // matrixSet: positionStore.projection.epsg,
//         attributions: wmtsLayerConfig.attributions.map((attr) => attr.name),
//         style: 'default',
//         // so that XYZ values will be filled as TileCol, TileRow and TileMatrix in the URL (see getWMTSUrl below)
//         requestEncoding: 'REST' as const,
//     }
// })

function createTileGridForProjection(): WMTSTileGrid {
    // const maxResolutionIndex = indexOfMaxResolution(
    //     positionStore.projection,
    //     wmtsLayerConfig.maxResolution
    // )
    // let resolutionSteps = positionStore.projection.getResolutionSteps()
    // if (resolutionSteps.length > maxResolutionIndex) {
    //     resolutionSteps = resolutionSteps.slice(0, maxResolutionIndex + 1)
    // }
    // return new WMTSTileGrid({
    //     resolutions: resolutionSteps.map((step) => step.resolution),
    //     origin: positionStore.projection.getTileOrigin(),
    //     matrixIds: resolutionSteps.map((_, index) => index.toString()),
    //     extent: positionStore.projection.bounds?.flatten,
    // })

    return new WMTSTileGrid({
        resolutions: [
            4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650,
            500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25,
        ],
        origin: [2420000, 1350000],
        matrixIds: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
            24, 25, 26, 27,
        ].map((id) => id.toString()),
        extent: [2490000, 1080000, 2900000, 1350000],
        // 2484273.3 1073150.16 2837939.88 1299970.97
    })
}

const layer = new TileLayer({
    properties: {
        id: wmtsLayerConfig.value.technicalName,
        uuid: wmtsLayerConfig.value.uuid,
    },
    opacity: 1, //opacity.value,
    source: createWMTSSourceForProjection(),
    maxResolution: 3,
    maxZoom: 3,
    minZoom: 0,
    minResolution: 0,
})

function getTransformedXYZUrl(): string {
    // layerConfig: OGC:Feature,
    // projection: CoordinateSystem | undefined,
    // addTimestamp: boolean = true
    // if (!layerConfig || !projection) {
    //     return ''
    // }
    // // TODO what do we have from the records?
    // const url = layerUtils.getWmtsXyzUrl?.(layerConfig, projection, { addTimestamp })
    // if (!url) {
    //     return ''
    // }
    const wmtsData = layerConfig.links.filter((link: OGC.Link) => link.protocol === 'OGC:WMTS')[0]
    const url = wmtsData.uriTemplate

    if (!url) {
        throw Error('Layer with WMTS config but no uriTemplate')
    }

    return url
    // return url.replace('{TileSetId}', '{TileMatrix}')

    // return url
    //     .replace('{z}', '{TileMatrix}')
    //     .replace('{x}', '{TileCol}')
    //     .replace('{y}', '{TileRow}')
}

/**
 * Returns an OpenLayers WMTS source, with some customization depending on the projection being
 * used.
 *
 * If the projection is a CustomCoordinateSystem, it will set the extent of this projection to a
 * dedicated TileGrid object, meaning that tiles outside the extent won't be requested.
 *
 * If the projection is not a CustomCoordinateSystem, it will default to a worldwide coverage,
 * meaning no limit where tiles shouldn't be requested.
 */
function createWMTSSourceForProjection(): WMTS {
    // log.debug('Create new WMTS source for projection', wmtsSourceConfig.value, wmtsTimeConfig.value)
    return new WMTS(wmtsSourceConfig.value)
}

useAddLayerToMap(layer, olMap.value, zIndex)
</script>

<template>
    <slot />
</template>
