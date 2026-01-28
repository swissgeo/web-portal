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

interface TileGridConfig {
    tileUrls: string[]
    resolutions: number[]
    origin: [number, number]
    extent: [number, number, number, number]
    tileSize: number
}

/** Sorts tile matrix items by zoom level in ascending order */
function sortByZoomLevel(items: TileMatrixItem[]): TileMatrixItem[] {
    return [...items].sort((a, b) => a.zoom_level - b.zoom_level)
}

/** Fetches the Mapbox style and extracts the vector source URL */
async function fetchVectorSourceUrl(styleUrl: string): Promise<string | null> {
    const styleResponse = await fetch(styleUrl)
    const styleJson: MapboxStyle = await styleResponse.json()

    const sourceEntry = Object.values(styleJson.sources).find((s) => s.type === 'vector')
    if (!sourceEntry?.url) {
        log.error('No vector source URL found in style')
        return null
    }
    return sourceEntry.url
}

/** Builds resolutions array from tile matrix items, extending to maxZoom if needed */
function buildResolutions(sortedItems: TileMatrixItem[], maxZoom: number): number[] | null {
    const resolutions = sortedItems.map((item) => item.pixel_x_size)

    const lastItem = sortedItems[sortedItems.length - 1]
    if (!lastItem) {
        log.error('No items in sorted tile matrix set')
        return null
    }

    const maxDefinedZoom = lastItem.zoom_level
    let lastResolution = resolutions[resolutions.length - 1]
    if (lastResolution === undefined) {
        log.error('No resolutions found in tile matrix set')
        return null
    }

    // Extend resolutions if maxzoom is higher than what's defined
    // (resolutions halve at each zoom level)
    for (let z = maxDefinedZoom + 1; z <= maxZoom; z++) {
        lastResolution = lastResolution / 2
        resolutions.push(lastResolution)
    }

    return resolutions
}

/** Extracts tile grid configuration from tile matrix set */
function buildTileGridConfig(
    tileMatrixSet: TileMatrixSet,
    tileJson: TileJson
): TileGridConfig | null {
    const sortedItems = sortByZoomLevel(tileMatrixSet.items)
    const firstItem = sortedItems[0]
    if (!firstItem) {
        log.error('No first item in sorted tile matrix set')
        return null
    }

    const maxZoom = tileJson.maxzoom ?? sortedItems[sortedItems.length - 1]?.zoom_level ?? 0
    const resolutions = buildResolutions(sortedItems, maxZoom)
    if (!resolutions) {
        return null
    }

    return {
        tileUrls: tileJson.tiles,
        resolutions,
        origin: firstItem.origin,
        extent: [
            tileMatrixSet.min_x,
            tileMatrixSet.min_y,
            tileMatrixSet.max_x,
            tileMatrixSet.max_y,
        ],
        tileSize: firstItem.tile_width,
    }
}

/** Fetches the style and TileJSON to extract tile grid configuration dynamically */
async function fetchTileGridConfig(styleUrl: string): Promise<TileGridConfig | null> {
    try {
        const vectorSourceUrl = await fetchVectorSourceUrl(styleUrl)
        if (!vectorSourceUrl) {
            return null
        }

        const tileJsonResponse = await fetch(vectorSourceUrl)
        const tileJson: TileJson = await tileJsonResponse.json()

        const tileMatrixSet = tileJson.tile_matrix_set
        if (!tileMatrixSet?.items?.length) {
            log.error('No tile_matrix_set found in TileJSON')
            return null
        }

        return buildTileGridConfig(tileMatrixSet, tileJson)
    } catch (error) {
        log.error('Failed to fetch tile grid configuration', { messages: [error] })
        return null
    }
}

/** Initializes the vector tile layer with source and style */
async function initializeVectorLayer(
    layer: VectorTileLayer,
    styleUrl: string,
    projection: string,
    layerId: string,
    zIndex: number
): Promise<void> {
    const config = await fetchTileGridConfig(styleUrl)
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
        projection: projection,
        url: config.tileUrls[0],
        // Performance optimizations
        cacheSize: 512, // Increase tile cache (default is 128)
        transition: 250, // Smooth tile fade-in (ms)
    })

    layer.setSource(source)

    // Apply the Mapbox style to the layer
    // Use tile grid resolutions (not view resolutions) for correct style zoom level mapping
    await applyStyle(layer, styleUrl, {
        resolutions: config.resolutions,
    })

    layer.setZIndex(zIndex)
    log.debug(`Vector layer ${layerId} initialized successfully`)
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
        // Performance optimizations
        renderMode: 'hybrid', // Better performance than 'vector'
        updateWhileAnimating: true, // Smooth panning
        updateWhileInteracting: true, // Smooth zooming
        preload: 1, // Preload 1 zoom level ahead
    })

    // Initialize the layer asynchronously
    initializeVectorLayer(
        layer,
        styleUrl,
        positionStore.projection.epsg,
        layerId,
        zIndex
    ).catch((error) => {
        log.error(`Unable to load and attach the style for ${layerId}`, { messages: [error] })
    })

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    function setOpacity(opacity: number) {
        layer.setOpacity(opacity)
    }

    return {
        setVisibility,
        setZIndex,
        setOpacity,
    }
}
