import type { FeatureExtractionPipeline } from "@huggingface/transformers";

import {
  makeServerLayer,
  useLayerStore,
  validateDataset,
} from "@swissgeo/layers";
import { usePositionStore } from "@swissgeo/map";
import { searchLocation } from "@swissgeo/search";
import { joinURL } from "ufo";

import type { NaturalLanguageCatalogRecord } from "@/utils/naturalLanguageMapSearch";

import {
  expandLayerQuery,
  extractPlaceQuery,
  findCatalogCandidates,
  findBestLayer,
  isCatalogRecord,
  refersToCurrentLocation,
  semanticText,
} from "@/utils/naturalLanguageMapSearch";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const MINIMUM_LAYER_SCORE = 0.4;
const DISPATCHER = { name: "natural-language-map-search-poc" };

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;
const catalogPromises = new Map<
  string,
  Promise<readonly NaturalLanguageCatalogRecord[]>
>();

function loadExtractor(): Promise<FeatureExtractionPipeline> {
  extractorPromise ??= import("@huggingface/transformers").then(
    ({ pipeline }) =>
      pipeline("feature-extraction", MODEL_ID, {
        device: "wasm",
        dtype: "q8",
      }),
  );
  return extractorPromise;
}

function readCatalogRecords(
  value: unknown,
): readonly NaturalLanguageCatalogRecord[] {
  if (
    value === null ||
    typeof value !== "object" ||
    !("features" in value) ||
    !Array.isArray(value.features)
  ) {
    throw new Error("The catalog returned an invalid feature collection");
  }
  return value.features.filter(isCatalogRecord);
}

function loadCatalog(
  endpoint: string,
  locale: string,
): Promise<readonly NaturalLanguageCatalogRecord[]> {
  const cacheKey = endpoint + "|" + locale;
  let request = catalogPromises.get(cacheKey);
  if (!request) {
    const url = new URL(
      joinURL(endpoint, "collections", "swissgeo.catalog", "items"),
    );
    url.searchParams.set("language", locale);
    request = fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error("Catalog request failed with " + response.status);
      }
      return readCatalogRecords(await response.json());
    });
    catalogPromises.set(cacheKey, request);
  }
  return request;
}

export function useNaturalLanguageMapSearch() {
  const runtimeConfig = useRuntimeConfig();
  const layerStore = useLayerStore();
  const positionStore = usePositionStore();
  const geolocationStore = useGeolocationStore();
  const isRunning = ref(false);
  const status = ref("");

  async function classifyLayer(
    query: string,
    candidates: readonly NaturalLanguageCatalogRecord[],
  ) {
    status.value = `Ranking ${candidates.length} catalog candidates…`;
    const extractor = await loadExtractor();
    const inputs = [query, ...candidates.map((layer) => semanticText(layer))];
    const output = await extractor(inputs, {
      normalize: true,
      pooling: "mean",
    });

    if (
      output.type !== "float32" ||
      !(output.data instanceof Float32Array) ||
      output.dims[0] !== inputs.length
    ) {
      throw new Error("The model returned unexpected embeddings");
    }

    const vectorSize = output.dims[1] ?? 0;
    return findBestLayer(output.data, vectorSize, candidates);
  }

  async function addLayer(datasetId: string, locale: string): Promise<void> {
    if (layerStore.layers.some((layer) => layer.humanId === datasetId)) {
      return;
    }

    const url = new URL(
      joinURL(
        runtimeConfig.public.ogcApiEndpoint,
        "collections",
        "swissgeo.catalog",
        "items",
        datasetId,
      ),
    );
    url.searchParams.set("language", locale);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Dataset request failed with ${response.status}`);
    }

    const dataset: unknown = await response.json();
    validateDataset(dataset);
    layerStore.addLayer(makeServerLayer(dataset));
  }

  async function moveToPlace(query: string, locale: string) {
    if (refersToCurrentLocation(query)) {
      geolocationStore.setGeolocationTracking(true, DISPATCHER);
      if (!geolocationStore.active) {
        geolocationStore.setGeolocationActive(true, DISPATCHER);
      }
      return "your location";
    }

    const placeQuery = extractPlaceQuery(query, locale);
    if (!placeQuery) {
      return;
    }

    const [place] = await searchLocation(placeQuery, locale, undefined, 1);
    if (!place?.coordinate) {
      throw new Error(`Could not find ${placeQuery}`);
    }

    positionStore.setCenter(place.coordinate, DISPATCHER);
    positionStore.setZoom(place.zoom, DISPATCHER);
    return place.sanitizedTitle;
  }

  async function run(query: string, locale: string): Promise<void> {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3 || isRunning.value) {
      return;
    }

    isRunning.value = true;
    try {
      status.value = "Searching the full catalog…";
      const catalog = await loadCatalog(
        runtimeConfig.public.ogcApiEndpoint,
        locale,
      );
      const layerQuery = expandLayerQuery(trimmedQuery);
      const candidates = findCatalogCandidates(layerQuery, catalog);
      if (candidates.length === 0) {
        status.value = "No matching catalog records found.";
        return;
      }

      const match = await classifyLayer(layerQuery, candidates);
      if (!match || match.score < MINIMUM_LAYER_SCORE) {
        status.value =
          "No confident layer match. Try naming the kind of map data you need.";
        return;
      }

      const layerTitle = match.layer.properties?.title ?? match.layer.id;
      status.value = `Adding ${layerTitle}…`;
      const [, place] = await Promise.all([
        addLayer(match.layer.id, locale),
        moveToPlace(trimmedQuery, locale),
      ]);
      status.value = place
        ? `Added ${layerTitle} near ${place}`
        : `Added ${layerTitle}`;
    } catch (error) {
      status.value = error instanceof Error ? error.message : String(error);
    } finally {
      isRunning.value = false;
    }
  }

  return { isRunning, run, status };
}
