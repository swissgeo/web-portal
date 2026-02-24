import type { Lang } from '@/language'

// System Constants
export const ALLOWED_LANGUAGES: Lang[] = ['de', 'fr']
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
