import {
  makeServerLayer,
  useLayerStore,
  validateDataset,
} from "@swissgeo/layers";
import { usePositionStore } from "@swissgeo/map";
import { searchLocation } from "@swissgeo/search";

import type {
  LayerMatch,
  NaturalLanguageCatalogRecord,
} from "@/utils/naturalLanguageMapSearch";
import type {
  SemanticProgressResponse,
  SemanticResultResponse,
} from "@/utils/naturalLanguageMapSearchProtocol";

import {
  expandLayerQuery,
  extractPlaceQuery,
  findCatalogCandidates,
  isCatalogRecord,
  refersToCurrentLocation,
  semanticText,
} from "@/utils/naturalLanguageMapSearch";
import {
  preloadModelWithWorker,
  rankLayersWithWorker,
} from "@/utils/naturalLanguageMapSearchWorker.client";

const MINIMUM_LAYER_SCORE = 0.4;
const CATALOG_PAGE_SIZE = 100;
const DISPATCHER = { name: "natural-language-map-search-poc" };

const catalogPromises = new Map<
  string,
  Promise<readonly NaturalLanguageCatalogRecord[]>
>();

export interface NaturalLanguageLayerSuggestion {
  id: string;
  score: number;
  title: string;
}

type PlaceResult = { place?: string } | { error: unknown };
export type SemanticModelLoadState = "error" | "idle" | "loading" | "ready";

function isNextLink(value: unknown): value is { href: string; rel: "next" } {
  return (
    value !== null &&
    typeof value === "object" &&
    "href" in value &&
    typeof value.href === "string" &&
    "rel" in value &&
    value.rel === "next"
  );
}

function readCatalogPage(value: unknown): {
  nextUrl?: string;
  records: readonly NaturalLanguageCatalogRecord[];
} {
  if (
    value === null ||
    typeof value !== "object" ||
    !("features" in value) ||
    !Array.isArray(value.features)
  ) {
    throw new Error("The catalog returned an invalid feature collection");
  }

  const nextLink =
    "links" in value && Array.isArray(value.links)
      ? value.links.find(isNextLink)
      : undefined;
  return {
    nextUrl: nextLink?.href,
    records: value.features.filter(isCatalogRecord),
  };
}

async function fetchCatalogPages(
  initialUrl: string,
): Promise<readonly NaturalLanguageCatalogRecord[]> {
  const records: NaturalLanguageCatalogRecord[] = [];
  const visitedUrls = new Set<string>();
  let nextUrl: string | undefined = initialUrl;

  while (nextUrl) {
    if (visitedUrls.has(nextUrl)) {
      throw new Error("The catalog returned a pagination cycle");
    }
    visitedUrls.add(nextUrl);

    const response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error("Catalog request failed with " + response.status);
    }

    const page = readCatalogPage(await response.json());
    records.push(...page.records);
    nextUrl = page.nextUrl
      ? new URL(page.nextUrl, nextUrl).toString()
      : undefined;
  }

  return records;
}

export function loadCatalog(
  catalogItemsUrl: string,
  locale: string,
): Promise<readonly NaturalLanguageCatalogRecord[]> {
  const cacheKey = catalogItemsUrl + "|" + locale;
  let request = catalogPromises.get(cacheKey);
  if (!request) {
    const url = new URL(catalogItemsUrl);
    url.searchParams.set("language", locale);
    url.searchParams.set("limit", String(CATALOG_PAGE_SIZE));
    request = fetchCatalogPages(url.toString()).catch((error: unknown) => {
      catalogPromises.delete(cacheKey);
      throw error;
    });
    catalogPromises.set(cacheKey, request);
  }
  return request;
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} s`;
}

function progressStatus(progress: SemanticProgressResponse): string {
  if (progress.stage === "loading-model") {
    return "Loading the multilingual model…";
  }
  if (progress.stage === "embedding") {
    return `Embedding ${progress.totalCandidates - progress.cachedCandidates} new candidates…`;
  }
  return "Ranking the best catalog matches…";
}

function rankingSummary(result: SemanticResultResponse): string {
  const totalCandidates = result.cacheHits + result.embeddedCandidates;
  return `${formatDuration(result.timings.totalMs)}, ${result.cacheHits}/${totalCandidates} vectors cached`;
}

function suggestion(match: LayerMatch): NaturalLanguageLayerSuggestion {
  return {
    id: match.layer.id,
    score: match.score,
    title: match.layer.properties?.title ?? match.layer.id,
  };
}

function settlePlace(
  promise: Promise<string | undefined>,
): Promise<PlaceResult> {
  return promise.then(
    (place) => ({ place }),
    (error: unknown) => ({ error }),
  );
}

function placeFrom(result: PlaceResult): string | undefined {
  if ("error" in result) {
    throw result.error;
  }
  return result.place;
}

export function useNaturalLanguageMapSearch() {
  const catalogItemsUrl = useCatalogItemsUrl();
  const layerStore = useLayerStore();
  const positionStore = usePositionStore();
  const geolocationStore = useGeolocationStore();
  const isRunning = ref(false);
  const modelLoadState = ref<SemanticModelLoadState>("idle");
  const status = ref("");
  const suggestions = ref<NaturalLanguageLayerSuggestion[]>([]);

  async function classifyLayers(
    query: string,
    candidates: readonly NaturalLanguageCatalogRecord[],
  ): Promise<{ matches: LayerMatch[]; result: SemanticResultResponse }> {
    const recordsById = new Map(
      candidates.map((record) => [record.id, record]),
    );
    const result = await rankLayersWithWorker(
      query,
      candidates.map((record) => ({
        id: record.id,
        text: semanticText(record),
      })),
      (progress) => {
        status.value = progressStatus(progress);
      },
    );
    const matches = result.scores.flatMap(({ id, score }) => {
      const layer = recordsById.get(id);
      return layer ? [{ layer, score }] : [];
    });
    return { matches, result };
  }

  async function loadModel(): Promise<void> {
    if (
      modelLoadState.value === "loading" ||
      modelLoadState.value === "ready"
    ) {
      return;
    }

    modelLoadState.value = "loading";
    status.value = "Loading the multilingual model…";
    try {
      await preloadModelWithWorker();
      modelLoadState.value = "ready";
      status.value = "Model ready";
    } catch (error) {
      modelLoadState.value = "error";
      status.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function addLayer(datasetId: string, locale: string): Promise<void> {
    if (layerStore.layers.some((layer) => layer.humanId === datasetId)) {
      return;
    }

    const url = new URL(catalogItemsUrl(datasetId));
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

  async function chooseLayer(
    selected: NaturalLanguageLayerSuggestion,
    locale: string,
  ): Promise<void> {
    if (isRunning.value) {
      return;
    }

    isRunning.value = true;
    try {
      status.value = `Adding ${selected.title}…`;
      await addLayer(selected.id, locale);
      status.value = `Added ${selected.title}`;
    } catch (error) {
      status.value = error instanceof Error ? error.message : String(error);
    } finally {
      isRunning.value = false;
    }
  }

  async function run(query: string, locale: string): Promise<void> {
    const trimmedQuery = query.trim();
    if (
      trimmedQuery.length < 3 ||
      isRunning.value ||
      modelLoadState.value !== "ready"
    ) {
      return;
    }

    isRunning.value = true;
    suggestions.value = [];
    const placeResultPromise = settlePlace(moveToPlace(trimmedQuery, locale));

    try {
      status.value = "Searching the full catalog…";
      const catalog = await loadCatalog(catalogItemsUrl(), locale);
      const layerQuery = expandLayerQuery(trimmedQuery);
      const candidates = findCatalogCandidates(layerQuery, catalog);
      if (candidates.length === 0) {
        const place = placeFrom(await placeResultPromise);
        status.value = place
          ? `Moved to ${place}, but found no matching catalog records.`
          : "No matching catalog records found.";
        return;
      }

      const { matches, result } = await classifyLayers(layerQuery, candidates);
      suggestions.value = matches.map(suggestion);
      const place = placeFrom(await placeResultPromise);
      const [bestMatch] = matches;
      if (!bestMatch || bestMatch.score < MINIMUM_LAYER_SCORE) {
        const location = place ? ` near ${place}` : "";
        status.value = `No confident layer match${location} · ${rankingSummary(result)}`;
        return;
      }

      const selected = suggestion(bestMatch);
      status.value = `Adding ${selected.title}…`;
      await addLayer(selected.id, locale);
      const location = place ? ` near ${place}` : "";
      status.value = `Added ${selected.title}${location} · ${rankingSummary(result)}`;
    } catch (error) {
      status.value = error instanceof Error ? error.message : String(error);
    } finally {
      isRunning.value = false;
    }
  }

  return {
    chooseLayer,
    isRunning,
    loadModel,
    modelLoadState,
    run,
    status,
    suggestions,
  };
}
