// Search API for web-poc-portal
// Adapted from web-mapviewer
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/api/src/search.ts

import type {
    LayerSearchResult,
    LocationSearchResult,
    SearchResponse,
    SearchResponseResult,
} from '../types/search'

// Regex to detect and strip HTML tags (from mapviewer line 32)
const REGEX_DETECT_HTML_TAGS = /<\/?[^>]+(>|$)/g

/**
 * Sanitize title by removing HTML tags (from mapviewer lines 38-40)
 */
export function sanitizeTitle(title: string = ''): string {
    return title.replace(REGEX_DETECT_HTML_TAGS, '')
}

/**
 * Parse location result from backend API response (adapted from mapviewer lines 76-149)
 * Use LV95 coordinates (x, y) directly from the API response
 *
 * NOTE: The geo.admin.ch API returns coordinates where:
 * - attrs.x = northing (Y in EPSG:2056, ~1'030'000 to 1'350'000 for Switzerland)
 * - attrs.y = easting (X in EPSG:2056, ~2'420'000 to 2'900'000 for Switzerland)
 *
 * We need to swap them to match the standard [X, Y] = [easting, northing] convention
 * used by OpenLayers and our coordinate system.
 */
function parseLocationResult(result: SearchResponseResult): LocationSearchResult {
    if (!result.attrs) {
        throw new Error('Invalid location result, cannot be parsed')
    }

    const { label, detail, featureId, x, y, zoomlevel } = result.attrs

    // Parse zoom level safely - API may return undefined or invalid values
    // The API sometimes returns 4294967295 (max uint32, essentially -1) as a sentinel for "no zoom"
    // Default to 6 for a wider city/region overview
    let zoom = 6
    if (
        zoomlevel !== undefined &&
        zoomlevel !== null &&
        typeof zoomlevel === 'number' &&
        zoomlevel >= 0 &&
        zoomlevel < 30 // Reasonable max zoom to filter out invalid values like 4294967295
    ) {
        zoom = zoomlevel
    }

    // Swap API's [x, y] = [northing, easting] to standard [easting, northing]
    return {
        resultType: 'LOCATION',
        id: featureId || label,
        featureId: featureId || label,
        title: label,
        sanitizedTitle: sanitizeTitle(label),
        description: detail || '',
        coordinate: x && y ? [y, x] : undefined, // [easting, northing] = [api.y, api.x]
        zoom,
    }
}

/**
 * Search for locations using the map.geo.admin.ch API
 * Adapted from mapviewer searchLocation (lines 187-226)
 *
 * @param queryString - Search query text
 * @param lang - Language code (de, fr, etc.)
 * @param abortSignal - Optional abort signal for cancellation
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with location search results
 */
export async function searchLocation(
    queryString: string,
    lang: string,
    abortSignal?: AbortSignal,
    limit: number = 10
): Promise<LocationSearchResult[]> {
    const trimmedQuery = queryString.trim()
    if (trimmedQuery.length < 2) {
        return []
    }

    // Use map.geo.admin.ch search API (from mapviewer lines 42-59)
    const url = new URL('https://api3.geo.admin.ch/rest/services/ech/SearchServer')
    url.searchParams.set('sr', '2056') // LV95 EPSG code
    url.searchParams.set('searchText', trimmedQuery)
    url.searchParams.set('lang', lang)
    url.searchParams.set('type', 'locations')
    url.searchParams.set('limit', String(limit))

    try {
        const response = await fetch(url.toString(), { signal: abortSignal })

        if (!response.ok) {
            throw new Error(`Search API error: ${response.status}`)
        }

        const data: SearchResponse = await response.json()

        // Filter results with attrs (from mapviewer lines 210-212)
        const resultWithAttrs = data.results?.filter((result) => !!result.attrs) || []

        return resultWithAttrs.map(parseLocationResult)
    } catch (error) {
        // Re-throw abort errors so they can be handled separately
        if (error instanceof Error && error.name === 'AbortError') {
            throw error
        }
        console.error('Failed to search locations:', error)
        return []
    }
}

/**
 * Search for layers in the local OGC catalog
 * New implementation (not in mapviewer - they search via backend API)
 *
 * @param queryString - Search query text
 * @param lang - Language code (de, fr, etc.)
 * @param catalogRecords - Array of OGC catalog records
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with layer search results
 */
export async function searchLayers(
    queryString: string,
    lang: string,
    catalogRecords: any[],
    limit: number = 10
): Promise<LayerSearchResult[]> {
    const query = queryString.toLowerCase().trim()

    if (query.length < 2) {
        return []
    }

    try {
        const matches = catalogRecords
            .filter((record) => {
                if (!record.properties) {
                    return false
                }

                const title = record.properties.title?.[lang] || ''
                const description = record.properties.description || ''
                const keywords = record.properties.keywords || []

                // Search in title, description, and keywords
                return (
                    title.toLowerCase().includes(query) ||
                    description.toLowerCase().includes(query) ||
                    keywords.some((k: string) => k.toLowerCase().includes(query))
                )
            })
            .slice(0, limit)
            .map((record) => ({
                resultType: 'LAYER' as const,
                id: record.id,
                layerId: record.id,
                title: record.properties.title[lang] || record.properties.title.en || record.id,
                sanitizedTitle: sanitizeTitle(
                    record.properties.title[lang] || record.properties.title.en || record.id
                ),
                description: record.properties.description || '',
            }))

        return matches
    } catch (error) {
        console.error('Failed to search layers:', error)
        return []
    }
}
