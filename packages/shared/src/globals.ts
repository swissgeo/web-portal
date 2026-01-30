import type { Lang } from './language'

export const ALLOWED_LANGUAGES: Lang[] = ['de', 'fr']

/** Timestamp to describe "all data" for time enabled WMS layer */
export const ALL_YEARS_TIMESTAMP: string = 'all'
/**
 * Timestamp to describe "current" or latest available data for a time enabled WMTS layer (and also
 * is the default value to give any WMTS layer that is not time enabled, as this timestamp is
 * required in the URL scheme)
 */
export const CURRENT_YEAR_TIMESTAMP: string = 'current'
