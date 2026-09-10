import type { Dataset, DatasetCollection } from "@swissgeo/ogc";
import type { MaybeRefOrGetter, Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { useDebounceFn } from "@vueuse/core";
import { toValue } from "vue";

/** The catalog service clamps `limit` to 100, larger values gain nothing */
const PAGE_SIZE = 100;

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Loads the OGC API Records catalog one page at a time.
 *
 * `data.features` accumulates across pages, so consumers keep reading a single
 * flat list and simply see it grow as `loadMore()` is called. Changing the
 * language or the search term starts over from the first page.
 */
export function useOgcCatalog(
  language: Ref<string>,
  query?: MaybeRefOrGetter<string>,
) {
  const catalogItemsUrl = useCatalogItemsUrl();

  const searchTerm = () => toValue(query)?.trim() ?? "";
  /** Identifies the list currently being accumulated */
  const generation = () => `${language.value}-${searchTerm()}`;

  const features = ref<Dataset[]>([]);
  const links = ref<DatasetCollection["links"]>([]);
  const total = ref<number | undefined>();
  const offset = ref(0);
  /** A page came back empty, there is nothing left regardless of the counts */
  const exhausted = ref(false);
  const lastPageSize = ref(0);

  let loadedGeneration: string | null = null;

  const asyncData = useAsyncData<DatasetCollection>(
    () => `ogc-catalog-${generation()}`,
    async () => {
      const requested = generation();
      if (requested !== loadedGeneration) {
        loadedGeneration = requested;
        offset.value = 0;
        features.value = [];
        links.value = [];
        total.value = undefined;
        exhausted.value = false;
        lastPageSize.value = 0;
      }

      const requestedOffset = offset.value;

      const term = searchTerm();

      log.debug({
        title: "useOgcCatalog",
        titleColor: LogPreDefinedColor.Yellow,
        messages: [
          "loading catalog page",
          { lang: language.value, offset: requestedOffset, q: term },
        ],
      });

      const page = await $fetch<DatasetCollection>(catalogItemsUrl(), {
        query: {
          lang: language.value,
          limit: PAGE_SIZE,
          offset: requestedOffset,
          ...(term ? { q: term } : {}),
        },
      });

      // Requests are never cancelled, so a superseded language or search term can
      // still resolve here. Its records belong to a list we are no longer building.
      if (requested === loadedGeneration) {
        features.value =
          requestedOffset === 0
            ? page.features
            : [...features.value, ...page.features];
        links.value = page.links ?? [];
        total.value = page.numberMatched;
        lastPageSize.value = page.features.length;
        exhausted.value = page.features.length === 0;
      }

      return collection();
    },
    { watch: [language] },
  );

  const { data, status, error, refresh } = asyncData;

  function collection(): DatasetCollection {
    return {
      type: "FeatureCollection",
      features: features.value,
      links: links.value,
      numberMatched: total.value,
      numberReturned: features.value.length,
    };
  }

  // On the client the accumulator starts empty while `data` is restored from the
  // SSR payload, so adopt that first page instead of re-fetching it.
  if (data.value && features.value.length === 0) {
    features.value = data.value.features;
    links.value = data.value.links ?? [];
    total.value = data.value.numberMatched;
    lastPageSize.value = data.value.features.length;
    offset.value = data.value.features.length;
    loadedGeneration = generation();
  }

  const hasMore = computed(() => {
    if (exhausted.value) return false;
    if (total.value !== undefined) return features.value.length < total.value;
    // Without the counts, trust `next` only on a page that was actually full: the
    // service emits it whenever a page fills up, including the very last one.
    return (
      lastPageSize.value === PAGE_SIZE &&
      links.value.some((link) => link.rel?.toLowerCase() === "next")
    );
  });

  async function loadMore(): Promise<void> {
    if (status.value === "pending" || !hasMore.value) return;
    offset.value = features.value.length;
    await refresh();
  }

  watch(
    () => searchTerm(),
    useDebounceFn(() => refresh(), SEARCH_DEBOUNCE_MS),
  );

  return {
    data,
    total,
    hasMore,
    status,
    error,
    loadMore,
  };
}
