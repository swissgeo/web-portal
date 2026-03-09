// Main exports for @swissgeo/search package

export {
    searchLayers,
    searchLocation,
    searchLayerFeatures,
    sanitizeTitle,
    SearchResultTypesEnum,
} from './api/search'
export type {
    SearchResult,
    SearchResultTypes,
    LayerSearchResult,
    LocationSearchResult,
    FeatureSearchResult,
    SearchResponse,
    SearchResponseResult,
} from './types/search'

export type { CatalogRecord } from './api/search'
