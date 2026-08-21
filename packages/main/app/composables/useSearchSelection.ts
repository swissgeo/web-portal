// Composable to handle search result selection
// Connects search results to map actions (center, zoom, add layers)

import type { Dataset } from "@swissgeo/ogc";
import type {
  ContentSearchResult,
  SearchResult,
  LocationSearchResult,
  LayerSearchResult,
  FeatureSearchResult,
} from "@swissgeo/search";

import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { usePositionStore } from "@swissgeo/map";
import { joinURL } from "ufo";

export function useSearchSelection() {
  const runtimeConfig = useRuntimeConfig();
  const toast = useToast();
  const { locale, t } = useI18n();

  // The content page a search result opened, or null when the modal is closed.
  const selectedContentPage = ref<ContentSearchResult | null>(null);

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
    } else if (result.resultType === "CONTENT") {
      handleContentSelection(result as ContentSearchResult);
    }
  }

  // A CMS result shows what the search returned in a modal and leaves the map
  // untouched. It cannot open the page itself yet: the CMS is headless and the
  // route that renders a document is still unmerged (PR #328).
  function handleContentSelection(result: ContentSearchResult) {
    selectedContentPage.value = result;
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

  // Selecting a layer adds it to the map; the (i) button in the result entry
  // opens the dataset panel instead.
  async function handleLayerSelection(result: LayerSearchResult) {
    const layerStore = useLayerStore();
    if (layerStore.layers.some((l) => l.humanId === result.layerId)) {
      return;
    }

    const url = new URL(
      joinURL(
        runtimeConfig.public.ogcApiEndpoint,
        "collections",
        runtimeConfig.public.ogcCatalogCollection,
        "items",
        result.layerId,
      ),
    );
    url.searchParams.set("lang", locale.value);

    try {
      const dataset = await $fetch<Dataset>(url.toString());
      layerStore.addLayer(makeServerLayer(dataset));
    } catch (e) {
      log.error(
        "Failed to add search result to map",
        e instanceof Error ? e : new Error(String(e)),
      );
      toast.add({ color: "error", title: t("dataset.addToMapError") });
    }
  }

  return {
    handleResultSelection,
    selectedContentPage,
  };
}
