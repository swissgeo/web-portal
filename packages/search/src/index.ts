// Main exports for @swissgeo/search package

export { searchLayers, searchLocation, sanitizeTitle } from './api/search'
export type {
    SearchResult,
    SearchResultTypes,
    LayerSearchResult,
    LocationSearchResult,
    SearchResponse,
    SearchResponseResult,
} from './types/search'
