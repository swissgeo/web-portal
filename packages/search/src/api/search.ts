// Search API for web-poc-portal

import log, { LogPreDefinedColor } from '@swissgeo/log'

import type {
    CatalogRecord,
    FeatureSearchResult,
    LayerSearchResult,
    LocationSearchResult,
    SearchResponse,
    SearchResponseResult,
} from '../types/search'

/**
 * Catalog record structure as used in layer search. This extends the base OGCRecord with the
 * specific property structure used by the swissgeo catalog.
 * Uses index signature to allow for potential language-specific fields (title_en, title_de, etc.)
 */

// Regex to detect and strip HTML tags
const REGEX_DETECT_HTML_TAGS = /<\/?[^>]+(>|$)/g

/** Escape HTML special characters to prevent XSS */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/** Sanitize title by removing HTML tags */
export function sanitizeTitle(title: string = ''): string {
    return title.replace(REGEX_DETECT_HTML_TAGS, '')
}

/**
 * Parse location result from backend API response
 * Use LV95 coordinates (x, y) directly from the API response
 *
 * NOTE: The geo.admin.ch API returns coordinates where:
 *
 * - Attrs.x = northing (Y in EPSG:2056, ~1'030'000 to 1'350'000 for Switzerland)
 * - Attrs.y = easting (X in EPSG:2056, ~2'420'000 to 2'900'000 for Switzerland)
 *
 * We need to swap them to match the standard [X, Y] = [easting, northing] convention used by
 * OpenLayers and our coordinate system.
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

    // Use map.geo.admin.ch search API
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

        // Filter results with attrs
        const resultWithAttrs = data.results?.filter((result) => !!result.attrs) || []

        return resultWithAttrs.map(parseLocationResult)
    } catch (error) {
        // Re-throw abort errors so they can be handled separately
        if (error instanceof Error && error.name === 'AbortError') {
            throw error
        }
        log.error({
            title: 'searchLocation',
            titleColor: LogPreDefinedColor.Red,
            messages: ['Failed to search locations:', error],
        })
        return []
    }
}

/**
 * Search for layers in the local OGC catalog
 *
 * @param queryString - Search query text
 * @param lang - Language code (de, fr, etc.)
 * @param catalogRecords - Array of OGC catalog records
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with layer search results
 */
export function searchLayers(
    queryString: string,
    lang: string,
    catalogRecords: CatalogRecord[],
    limit: number = 10
): Promise<LayerSearchResult[]> {
    const query = queryString.toLowerCase().trim()

    if (query.length < 2) {
        return Promise.resolve([])
    }

    try {
        /**
         * Helper function to check if query matches any string value
         * Searches across default fields and potential language-specific fields
         */
        const matchesInProperties = (
            properties: NonNullable<CatalogRecord['properties']>
        ): boolean => {
            const searchableFields: string[] = []

            // Add default fields
            if (properties.title) {
                searchableFields.push(properties.title)
            }
            if (properties.description) {
                searchableFields.push(properties.description)
            }
            if (properties.keywords) {
                searchableFields.push(...properties.keywords.map(String))
            }

            // Add potential language-specific fields (title_en, title_de, title_fr, etc.)
            // and other string properties that might contain searchable content
            for (const [key, value] of Object.entries(properties)) {
                if (
                    typeof value === 'string' &&
                    (key.startsWith('title_') ||
                        key.startsWith('description_') ||
                        key.startsWith('name_') ||
                        key === 'label' ||
                        key === 'name')
                ) {
                    searchableFields.push(value)
                }
            }

            // Check if query matches any field
            return searchableFields.some((field) => field.toLowerCase().includes(query))
        }

        const matches = catalogRecords
            .filter(
                (
                    record
                ): record is CatalogRecord & {
                    properties: NonNullable<CatalogRecord['properties']>
                } => {
                    if (!record.properties) {
                        return false
                    }

                    return (
                        record.id.toLowerCase().includes(query) ||
                        matchesInProperties(record.properties)
                    )
                }
            )
            .slice(0, limit)
            .map((record) => {
                // Prefer language-specific title if available, fall back to default title
                const langTitle = record.properties[`title_${lang}`]
                const title =
                    typeof langTitle === 'string' && langTitle
                        ? langTitle
                        : record.properties.title || record.id
                return {
                    resultType: 'LAYER' as const,
                    id: record.id,
                    layerId: record.id,
                    title,
                    sanitizedTitle: sanitizeTitle(title),
                    description: record.properties.description || '',
                }
            })

        return Promise.resolve(matches)
    } catch (error) {
        log.error({
            title: 'searchLayers',
            titleColor: LogPreDefinedColor.Red,
            messages: ['Failed to search layers:', error],
        })
        return Promise.resolve([])
    }
}

/**
 * Search for features within a specific layer using the geo.admin.ch API
 *
 * @param queryString - Search query text
 * @param lang - Language code (de, fr, etc.)
 * @param layerId - ID of the layer to search within
 * @param layerName - Name of the layer for display
 * @param abortSignal - Optional abort signal for cancellation
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with feature search results
 */
export async function searchLayerFeatures(
    queryString: string,
    lang: string,
    layerId: string,
    layerName: string,
    abortSignal?: AbortSignal,
    limit: number = 10
): Promise<FeatureSearchResult[]> {
    const trimmedQuery = queryString.trim()
    if (trimmedQuery.length < 2) {
        return []
    }

    // Use map.geo.admin.ch featuresearch API
    const url = new URL('https://api3.geo.admin.ch/rest/services/ech/SearchServer')
    url.searchParams.set('sr', '2056') // LV95 EPSG code
    url.searchParams.set('searchText', trimmedQuery)
    url.searchParams.set('lang', lang)
    url.searchParams.set('type', 'featuresearch')
    url.searchParams.set('features', layerId)
    url.searchParams.set('limit', String(limit))

    try {
        const response = await fetch(url.toString(), { signal: abortSignal })

        if (!response.ok) {
            throw new Error(`Feature search API error: ${response.status}`)
        }

        const data: SearchResponse = await response.json()

        // Filter results with attrs
        const resultWithAttrs = data.results?.filter((result) => !!result.attrs) || []

        return resultWithAttrs.map((result) => {
            // Feature search results don't have x/y, but have geom_st_box2d
            // Parse coordinates from the bounding box
            let coordinate: [number, number] | undefined

            if (result.attrs.geom_st_box2d) {
                // Extract coordinates from BOX(x1 y1, x2 y2) format
                const boxMatch = result.attrs.geom_st_box2d.match(
                    /BOX\(([0-9.]+)\s+([0-9.]+),([0-9.]+)\s+([0-9.]+)\)/
                )
                if (boxMatch) {
                    // Use the first point (or center if it's a polygon)
                    const x = parseFloat(boxMatch[1]!)
                    const y = parseFloat(boxMatch[2]!)
                    coordinate = [x, y]
                }
            }

            return {
                resultType: 'FEATURE' as const,
                id: result.attrs.featureId || result.attrs.label,
                featureId: result.attrs.featureId || result.attrs.label,
                layerId,
                layerName,
                // Format title to show layer name in bold - escape HTML to prevent XSS
                title: `<strong>${escapeHtml(layerName)}</strong><br/>${escapeHtml(result.attrs.label)}`,
                sanitizedTitle: `${layerName} - ${sanitizeTitle(result.attrs.label)}`,
                description: result.attrs.detail || '',
                coordinate,
                zoom: result.attrs.zoomlevel || 10, // Default to zoom 10 for features
            }
        })
    } catch (error) {
        // Re-throw abort errors so they can be handled separately
        if (error instanceof Error && error.name === 'AbortError') {
            throw error
        }
        log.error({
            title: 'searchLayerFeatures',
            titleColor: LogPreDefinedColor.Red,
            messages: ['Failed to search layer features:', error],
        })
        return []
    }
}
