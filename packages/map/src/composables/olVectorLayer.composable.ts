import type { Map } from 'ol'

import log from '@swissgeo/log'
import { applyStyle } from 'ol-mapbox-style'
import MVT from 'ol/format/MVT'
import VectorTileLayer from 'ol/layer/VectorTile'
import VectorTileSource from 'ol/source/VectorTile'
import TileGrid from 'ol/tilegrid/TileGrid'

import usePositionStore from '@/stores/position/'

import useAddLayerToMap from './useAddLayerToMap.composable'

interface TileMatrixItem {
    zoom_level: number
    pixel_x_size: number
    origin: [number, number]
    tile_width: number
    tile_height: number
}

interface TileMatrixSet {
    items: TileMatrixItem[]
    min_x: number
    min_y: number
    max_x: number
    max_y: number
}

interface TileJson {
    tiles: string[]
    tile_matrix_set?: TileMatrixSet
    minzoom?: number
    maxzoom?: number
}

interface MapboxStyle {
    sources: Record<string, { url?: string; type: string }>
}

/** Sorts tile matrix items by zoom level in ascending order */
function sortByZoomLevel(items: TileMatrixItem[]): TileMatrixItem[] {
    return [...items].sort((a, b) => a.zoom_level - b.zoom_level)
}

/** Fetches the style and TileJSON to extract tile grid configuration dynamically */
async function fetchTileGridConfig(styleUrl: string): Promise<{
    tileUrls: string[]
    resolutions: number[]
    origin: [number, number]
    extent: [number, number, number, number]
    tileSize: number
} | null> {
    try {
        // Fetch the Mapbox style
        const styleResponse = await fetch(styleUrl)
        const styleJson: MapboxStyle = await styleResponse.json()

        // Get the first vector source URL
        const sourceEntry = Object.values(styleJson.sources).find((s) => s.type === 'vector')
        if (!sourceEntry?.url) {
            log.error('No vector source URL found in style')
            return null
        }

        // Fetch the TileJSON
        const tileJsonResponse = await fetch(sourceEntry.url)
        const tileJson: TileJson = await tileJsonResponse.json()

        // Extract tile grid config from tile_matrix_set
        const tileMatrixSet = tileJson.tile_matrix_set
        if (!tileMatrixSet?.items?.length) {
            log.error('No tile_matrix_set found in TileJSON')
            return null
        }

        // Sort by zoom level and extract resolutions
        const sortedItems = sortByZoomLevel(tileMatrixSet.items)
        const resolutions = sortedItems.map((item) => item.pixel_x_size)

        // Extend resolutions if maxzoom is higher than what's defined in tile_matrix_set
        // (resolutions halve at each zoom level)
        const lastItem = sortedItems[sortedItems.length - 1]
        if (!lastItem) {
            log.error('No items in sorted tile matrix set')
            return null
        }
        const maxDefinedZoom = lastItem.zoom_level
        const maxZoom = tileJson.maxzoom ?? maxDefinedZoom
        let lastResolution = resolutions[resolutions.length - 1]
        if (lastResolution === undefined) {
            log.error('No resolutions found in tile matrix set')
            return null
        }
        for (let z = maxDefinedZoom + 1; z <= maxZoom; z++) {
            lastResolution = lastResolution / 2
            resolutions.push(lastResolution)
        }

        const firstItem = sortedItems[0]
        if (!firstItem) {
            log.error('No first item in sorted tile matrix set')
            return null
        }
        const origin: [number, number] = firstItem.origin
        const extent: [number, number, number, number] = [
            tileMatrixSet.min_x,
            tileMatrixSet.min_y,
            tileMatrixSet.max_x,
            tileMatrixSet.max_y,
        ]
        const tileSize = firstItem.tile_width

        return {
            tileUrls: tileJson.tiles,
            resolutions,
            origin,
            extent,
            tileSize,
        }
    } catch (error) {
        log.error('Failed to fetch tile grid configuration', { messages: [error] })
        return null
    }
}

export default function useOlVectorLayer(layerId: string, zIndex: number, styleUrl: string) {
    const olMap = toValue(inject<Map>('olMap'))
    const positionStore = usePositionStore()

    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    // Create the vector tile layer (source will be set after fetching config)
    const layer = new VectorTileLayer({
        declutter: true,
        properties: {
            id: layerId,
        },
    })

    // Get view resolutions for style zoom level mapping
    const viewResolutions = positionStore.projection
        .getResolutionSteps()
        .map((step: { resolution: number }) => step.resolution)

    // Fetch tile grid config and set up the layer
    fetchTileGridConfig(styleUrl)
        .then((config) => {
            if (!config) {
                throw new Error('Failed to get tile grid configuration')
            }

            // Create tile grid from the fetched configuration
            const tileGrid = new TileGrid({
                origin: config.origin,
                extent: config.extent,
                resolutions: config.resolutions,
                tileSize: config.tileSize,
            })

            // Create and set the vector tile source
            const source = new VectorTileSource({
                format: new MVT(),
                tileGrid: tileGrid,
                projection: positionStore.projection.epsg,
                url: config.tileUrls[0],
            })

            layer.setSource(source)

            // Apply the Mapbox style to the layer
            return applyStyle(layer, styleUrl, {
                resolutions: viewResolutions,
            })
        })
        .then(() => {
            layer.setZIndex(zIndex)
            log.debug(`Vector layer ${layerId} initialized successfully`)
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
