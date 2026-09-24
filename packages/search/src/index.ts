// Main exports for @swissgeo/search package

export { searchCoordinate } from "./api/coordinateSearch";
export {
  searchLayers,
  searchLocation,
  searchLayerFeatures,
  searchContentPages,
  sanitizeTitle,
  SearchResultTypesEnum,
} from "./api/search";
export type {
  SearchResult,
  CoordinateSearchResult,
  SearchResultTypes,
  LayerSearchResult,
  LocationSearchResult,
  FeatureSearchResult,
  ContentSearchResult,
  ContentPageSearchResponse,
  SearchResponse,
  SearchResponseResult,
} from "./types/search";

export type { CatalogRecord } from "./api/search";
