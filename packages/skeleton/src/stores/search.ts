// Search store for web-poc-portal
// Adapted from web-mapviewer search store

import type { DatasetCollection } from "@swissgeo/ogc";
import type { SearchResult } from "@swissgeo/search";

import { useLayerStore } from "@swissgeo/layers";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import {
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
  const catalog = ref<DatasetCollection>();
  const catalogLanguage = ref<string>();

  let abortController: AbortController | undefined;

  // Load catalog data with language support
  const loadCatalog = async (lang?: string) => {
    // If catalog exists and language hasn't changed, don't reload
    if (catalog.value && catalogLanguage.value === lang) {
      return;
    }

    try {
      const baseUrl = runtimeConfig.public.ogcApiEndpoint;

      // Build URL with language parameter
      const url = new URL(baseUrl);
      if (lang) {
        url.searchParams.set("language", lang);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(
          `Failed to load catalog: ${response.status} ${response.statusText}`,
        );
      }

      catalog.value = await response.json();
      catalogLanguage.value = lang;
    } catch (error) {
      log.error({
        title: "SearchStore/loadCatalog",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Failed to load catalog:", error],
      });
    }
  };

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

  // Actions
  async function setSearchQuery(newQuery: string, lang: string = "de") {
    query.value = newQuery;

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

    try {
      // Load catalog with current language
      await loadCatalog(lang);

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

      // Build search promises array
      const searchPromises: Promise<SearchResult[]>[] = [
        searchLocation(newQuery, lang, abortController.signal),
      ];

      if (!catalog.value?.records) {
        return;
      }
      // the layers are searched through a local catalog, it's not an async operation
      const searchedLayers =
        searchLayers(newQuery, catalog.value?.records ?? []) ?? [];

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
        const successfulResults: SearchResult[] = [];
        for (const result of allResults) {
          if (result.status === "fulfilled") {
            successfulResults.push(...result.value);
          } else {
            // Log failed searches but don't block other results
            const error = result.reason;
            if (!(error instanceof Error && error.name === "AbortError")) {
              log.error({
                title: "SearchStore/setSearchQuery",
                titleColor: LogPreDefinedColor.Red,
                messages: ["Search request failed:", error],
              });
            }
          }
        }
        searchedLayers.forEach((result) => successfulResults.push(result));
        results.value = successfulResults;
      }
    } catch (error) {
      // Don't show error for aborted requests
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      log.error({
        title: "SearchStore/setSearchQuery",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Search error:", error],
      });
      results.value = [];
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
  }

  return {
    // State
    query,
    results,
    isSearching,
    catalog,
    // Getters
    hasResults,
    locationResults,
    layerResults,
    featureResults,
    // Actions
    setSearchQuery,
    selectResult,
    clearSearch,
    loadCatalog,
  };
});
