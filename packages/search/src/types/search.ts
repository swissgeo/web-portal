// Search types for web-poc-portal
// Adapted from web-mapviewer
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/api/src/types/search.ts

export type SearchResultTypes = 'LAYER' | 'LOCATION'

/**
 * Base interface for all search results
 */
export interface SearchResult {
    resultType: SearchResultTypes
    /** ID of this search result */
    id: string
    /** Title of this search result (can be HTML as a string) */
    title: string
    /** The title without any HTML tags */
    sanitizedTitle: string
    /** A description of this search result (plain text only, no HTML) */
    description: string
}

/**
 * Search result for layers
 */
export interface LayerSearchResult extends SearchResult {
    resultType: 'LAYER'
    /** ID of the layer in the catalog */
    layerId: string
}

/**
 * Search result for locations/addresses
 */
export interface LocationSearchResult extends SearchResult {
    resultType: 'LOCATION'
    /**
     * ID of this feature given by the backend
     */
    featureId: string
    /** Coordinate in LV95 projection [x, y] */
    coordinate?: [number, number]
    /**
     * The zoom level at which the map should be zoomed when showing the location
     */
    zoom: number
}

// Backend API response types (from map.geo.admin.ch API)

export interface SearchResponseResult {
    id: number
    weight: number
    attrs: {
        featureId: string
        detail: string
        geom_quadindex?: string
        geom_st_box2d?: string
        label: string
        lat: number
        lon: number
        num?: number
        objectclass?: string
        origin?: string
        rank?: number
        x: number
        y: number
        zoomlevel: number
        layer?: string
    }
}

export interface SearchResponse {
    results: SearchResponseResult[]
}
