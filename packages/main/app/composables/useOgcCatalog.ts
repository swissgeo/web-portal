import type { Dataset, DatasetCollection } from "@swissgeo/ogc";
import type { MaybeRefOrGetter, Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { toValue } from "vue";

/** The catalog service clamps `limit` to 100, larger values gain nothing */
const PAGE_SIZE = 100;

/**
 * Loads the OGC API Records catalog one page at a time. `data.features`
 * accumulates across pages, so consumers read a single flat list that grows with
 * every `loadMore()`. Changing the language or the search term starts over.
 */
export function useOgcCatalog(
  language: Ref<string>,
  query?: MaybeRefOrGetter<string>,
) {
  const catalogItemsUrl = useCatalogItemsUrl();

  const searchTerm = () => toValue(query)?.trim() ?? "";
  /** Identifies the list being accumulated, a new one restarts from offset 0 */
  const generation = () => `${language.value}-${searchTerm()}`;

  const features = ref<Dataset[]>([]);
  let loadedGeneration = "";

  const { data, status, error, refresh } = useAsyncData<DatasetCollection>(
    () => `ogc-catalog-${generation()}`,
    async () => {
      const requested = generation();
      if (requested !== loadedGeneration) {
        loadedGeneration = requested;
        features.value = [];
      }

      const offset = features.value.length;
      const term = searchTerm();

      log.debug({
        title: "useOgcCatalog",
        titleColor: LogPreDefinedColor.Yellow,
        messages: [
          "loading catalog page",
          { lang: language.value, offset, q: term },
        ],
      });

      const page = await $fetch<DatasetCollection>(catalogItemsUrl(), {
        query: {
          lang: language.value,
          limit: PAGE_SIZE,
          offset,
          ...(term ? { q: term } : {}),
        },
      });

      // Requests are not cancelled, so a superseded language or search term can
      // still resolve here. Its records belong to a list we no longer build.
      if (requested === loadedGeneration) {
        features.value = [...features.value, ...page.features];
      }

      return {
        ...page,
        features: features.value,
        numberReturned: features.value.length,
      };
    },
    { watch: [language, () => searchTerm()] },
  );

  const total = computed(() => data.value?.numberMatched ?? 0);
  const hasMore = computed(
    () => (data.value?.features.length ?? 0) < total.value,
  );

  async function loadMore(): Promise<void> {
    if (status.value === "pending" || !hasMore.value) {
      return;
    }
    await refresh();
  }

  return { data, total, hasMore, status, error, loadMore };
}
