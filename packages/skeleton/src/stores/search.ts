import type { SingleCoordinate } from "@swissgeo/coordinates";
import type { SearchResult } from "@swissgeo/search";

import { useLayerStore } from "@swissgeo/layers";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { buildCatalogItemsUrl } from "@swissgeo/ogc";
import {
  searchCoordinate,
  searchLayers,
  searchLocation,
  searchLayerFeatures,
} from "@swissgeo/search";
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSearchStore = defineStore("search", () => {
  const runtimeConfig = useRuntimeConfig();
  // State
  const query = ref("");
  const results = ref<SearchResult[]>([]);
  const isSearching = ref(false);
  // True when a search request failed, so the UI can tell an error apart from
  // an empty result set.
  const hasError = ref(false);
  // Coordinate the map marks with a marker, set when a coordinate result is selected.
  const pinnedCoordinate = ref<SingleCoordinate | undefined>();

  let abortController: AbortController | undefined;

  // Build the OGC API Records `/items` endpoint used to search layers.
  const catalogItemsUrl = computed(() =>
    buildCatalogItemsUrl(
      runtimeConfig.public.ogcApiEndpoint as string,
      runtimeConfig.public.ogcCatalogCollection as string,
    ),
  );

  // Getters
  const hasResults = computed(() => results.value.length > 0);

  const locationResults = computed(() =>
    results.value.filter((r: SearchResult) => r.resultType === "LOCATION"),
  );

  const layerResults = computed(() =>
    results.value.filter((r: SearchResult) => r.resultType === "LAYER"),
  );

  const featureResults = computed(() =>
    results.value.filter((r: SearchResult) => r.resultType === "FEATURE"),
  );

  const coordinateResults = computed(() =>
    results.value.filter((r: SearchResult) => r.resultType === "COORDINATE"),
  );

  // Actions
  async function setSearchQuery(newQuery: string, lang: string = "de") {
    query.value = newQuery;
    hasError.value = false;

    // Clear results if query too short
    if (newQuery.trim().length < 2) {
      results.value = [];
      return;
    }

    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const currentController = abortController;

    isSearching.value = true;

    // a coordinate is recognized locally, so we can show it before any request comes back
    const coordinateResult = searchCoordinate(newQuery);
    if (coordinateResult) {
      results.value = [coordinateResult];
    }

    try {
      // Get searchable layers from layer store
      // For now, enable feature search for ALL visible layers
      const layerStore = useLayerStore();

      /**
       * TODO:
       *  - at one point, the search will be its own module.
       *  - at that point, the source will tell us if the layer is searchable
       *  - we will give the sources through a prop
       *  - We will also give a prop to the search module making a link between map visibility and the uuid (in the context of a map view search)
       *  this will give something like :
       * const searchableLayers = sources.filter((source) => source.isSearchable && isVisible[source.uuid])
       */
      const searchableLayers = layerStore.layers;

      // Build search promises array. Layers are now searched server-side
      // through the OGC API Records catalog, alongside locations and features.
      const searchPromises: Promise<SearchResult[]>[] = [
        searchLocation(newQuery, lang, abortController.signal),
        searchLayers(
          newQuery,
          catalogItemsUrl.value,
          lang,
          abortController.signal,
        ),
      ];

      // Add feature search for each searchable layer
      for (const layer of searchableLayers) {
        searchPromises.push(
          searchLayerFeatures(
            newQuery,
            lang,
            layer.humanId,
            layer.info?.displayName || layer.humanId,
            abortController.signal,
          ),
        );
      }

      // Execute all searches in parallel - use allSettled to allow partial results
      const allResults = await Promise.allSettled(searchPromises);

      // Only update results if this request hasn't been superseded
      if (currentController === abortController) {
        // Extract successful results and log any failures
        const successfulResults: SearchResult[] = coordinateResult
          ? [coordinateResult]
          : [];
        for (const result of allResults) {
          if (result.status === "fulfilled") {
            successfulResults.push(...result.value);
          } else {
            // Log failed searches but don't block other results
            const error = result.reason;
            if (!(error instanceof Error && error.name === "AbortError")) {
              hasError.value = true;
              log.error({
                title: "SearchStore/setSearchQuery",
                titleColor: LogPreDefinedColor.Red,
                messages: ["Search request failed:", error],
              });
            }
          }
        }
        results.value = successfulResults;
      }
    } catch (error) {
      // Don't show error for aborted requests
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      hasError.value = true;
      log.error({
        title: "SearchStore/setSearchQuery",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Search error:", error],
      });
      results.value = coordinateResult ? [coordinateResult] : [];
    } finally {
      if (currentController === abortController) {
        isSearching.value = false;
        abortController = undefined;
      }
    }
  }

  function selectResult(result: SearchResult) {
    // Store the selected result for handling at app level
    // The app component will listen to result changes and handle:
    // - For locations: center map and zoom
    // - For layers: add layer to map

    // Note: Actual handling is done in the app component where
    // both position and layer stores are accessible

    // Clear search after selection
    clearSearch();

    // Return the result for external handling
    return result;
  }

  function clearSearch() {
    query.value = "";
    results.value = [];
    hasError.value = false;
  }

  function setPinnedCoordinate(coordinate: SingleCoordinate) {
    pinnedCoordinate.value = coordinate;
  }

  function clearPinnedCoordinate() {
    pinnedCoordinate.value = undefined;
  }

  return {
    // State
    query,
    results,
    isSearching,
    hasError,
    pinnedCoordinate,
    // Getters
    hasResults,
    locationResults,
    layerResults,
    featureResults,
    coordinateResults,
    // Actions
    setSearchQuery,
    selectResult,
    clearSearch,
    setPinnedCoordinate,
    clearPinnedCoordinate,
  };
});
