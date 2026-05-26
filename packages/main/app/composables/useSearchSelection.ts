// Composable to handle search result selection
// Connects search results to map actions (center, zoom, add layers)

import type {
  SearchResult,
  LocationSearchResult,
  LayerSearchResult,
  FeatureSearchResult,
} from "@swissgeo/search";

import { usePositionStore } from "@swissgeo/map";

export function useSearchSelection() {
  async function handleResultSelection(result: SearchResult) {
    // Only run on client side to avoid SSR serialization issues
    if (!process.client) {
      return;
    }

    if (result.resultType === "LOCATION") {
      handleLocationSelection(result as LocationSearchResult);
    } else if (result.resultType === "FEATURE") {
      handleFeatureSelection(result as FeatureSearchResult);
    } else if (result.resultType === "LAYER") {
      await handleLayerSelection(result as LayerSearchResult);
    }
  }

  function handleLocationSelection(result: LocationSearchResult) {
    if (!result.coordinate) {
      return;
    }

    const positionStore = usePositionStore();
    positionStore.setCenter(result.coordinate, {
      name: "search-result-selection",
    });
    positionStore.setZoom(result.zoom, { name: "search-result-selection" });
  }

  function handleFeatureSelection(result: FeatureSearchResult) {
    if (!result.coordinate) {
      return;
    }

    const positionStore = usePositionStore();
    positionStore.setCenter(result.coordinate, {
      name: "search-feature-selection",
    });

    const featureZoom =
      result.zoom && result.zoom > 0 && result.zoom < 20 ? result.zoom : 10;
    positionStore.setZoom(featureZoom, { name: "search-feature-selection" });
  }

  async function handleLayerSelection(result: LayerSearchResult) {
    const localePath = useLocalePath();

    await navigateTo(localePath(`/dataset/${result.layerId}`));
  }

  return {
    handleResultSelection,
  };
}
