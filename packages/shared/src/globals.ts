import type { Lang } from '@/language'

// System Constants
export const ALLOWED_LANGUAGES: Lang[] = ['de', 'fr', 'en', 'it', 'rm']
export const DRAWING_LAYER_ID = 'user-drawing-layer'

// Time constants
/**
 * "Timestamp" to describe "Every" period in which the data is available, and the intention to show them all at the same time (for example: accidents).
 */
export const ALL_YEARS_TIMESTAMP: string = 'all'

/**
 * Timestamp to describe "current" or latest available data for a time enabled WMTS layer (and also
 * is the default value to give any WMTS layer that is not time enabled, as this timestamp is
 * required in the URL scheme)
 */
export const CURRENT_YEAR_TIMESTAMP: string = 'current'

// Projection constants
export const EPSG_4326_WGS84: string = 'EPSG:4326'
export const EPSG_2056_CH1903: string = 'EPSG:2056'

/**
 * Serializable representation of a layer for state configuration.
 * Uses datasetUrl to re-fetch the full dataset on import.
 */
export interface LayerStateConfig {
    datasetUrl: string
    type: string
    isVisible: boolean
    opacity: number
    dimensions?: Record<string, { currentValue: string | null }>
}

/**
 * JSON structure representing the full app state for sharing/shortlink.
 * Coordinates use LV95 (EPSG:2056) [x, y].
 */
export interface AppStateConfig {
    version: 2
    map: {
        center: [number, number] // [x, y] in LV95 (EPSG:2056)
        zoom: number
        rotation: number
    }
    layers: LayerStateConfig[]
    backgroundLayer?: LayerStateConfig | null
}
