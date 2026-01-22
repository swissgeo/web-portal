import type { Map } from 'ol'

import log from '@swissgeo/log'
import { applyStyle } from 'ol-mapbox-style'
import VectorTileLayer from 'ol/layer/VectorTile'
import VectorTileSource from 'ol/source/VectorTile'
import MVT from 'ol/format/MVT'
import TileGrid from 'ol/tilegrid/TileGrid'

import useAddLayerToMap from './useAddLayerToMap.composable'
import usePositionStore from '@/stores/position/'

// MapTiler LV95 tile grid configuration from tiles.json
// These resolutions match the MapTiler tile pyramid for LV95
const MAPTILER_LV95_TILE_RESOLUTIONS = [
    1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625,
]
const MAPTILER_LV95_ORIGIN: [number, number] = [2420000, 1350000]
const MAPTILER_LV95_EXTENT: [number, number, number, number] = [2420000, 825712, 2944288, 1350000]
const MAPTILER_TILE_SIZE = 512

export default function useOlVectorLayer(layerId: string, zIndex: number, style: string) {
    console.log('New instance B')
    const olMap = toValue(inject<Map>('olMap'))
    const positionStore = usePositionStore()

    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    // Create tile grid matching the MapTiler LV95 tile pyramid
    const tileGrid = new TileGrid({
        origin: MAPTILER_LV95_ORIGIN,
        extent: MAPTILER_LV95_EXTENT,
        resolutions: MAPTILER_LV95_TILE_RESOLUTIONS,
        tileSize: MAPTILER_TILE_SIZE,
    })

    // Create vector tile source with the correct tile grid
    const source = new VectorTileSource({
        format: new MVT(),
        tileGrid: tileGrid,
        projection: positionStore.projection.epsg,
    })

    // Create the vector tile layer
    const layer = new VectorTileLayer({
        source: source,
        declutter: true,
        properties: {
            id: layerId,
        },
    })

    // Get view resolutions for style zoom level mapping
    const viewResolutions = positionStore.projection
        .getResolutionSteps()
        .map((step) => step.resolution)

    // Apply the Mapbox style to the layer
    // The resolutions option maps view resolution to style zoom levels
    applyStyle(layer, style, {
        resolutions: viewResolutions,
    })
        .then(() => {
            layer.setZIndex(zIndex)
        })
        .catch((error) => {
            log.error(`Unable to load and attach the style for ${layerId}`, { messages: [error] })
        })

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return {
        setVisibility,
        setZIndex,
    }
}
