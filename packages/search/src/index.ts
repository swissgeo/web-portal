// Main exports for @swissgeo/search package

export { searchLayers, searchLocation, searchLayerFeatures, sanitizeTitle } from './api/search'
export type {
    SearchResult,
    SearchResultTypes,
    LayerSearchResult,
    LocationSearchResult,
    FeatureSearchResult,
    SearchResponse,
    SearchResponseResult,
} from './types/search'
