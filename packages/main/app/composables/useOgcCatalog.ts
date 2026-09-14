import type { DatasetCollection } from "@swissgeo/ogc";
import type { MaybeRefOrGetter, Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { toError } from "@swissgeo/shared";
import { toValue } from "vue";

/** Corresponds to the max supported `limit` value of the catalog backend service */
const PAGE_SIZE = 100;

/**
 * The records loaded so far are kept while the next page is pending, and when
 * it fails, so the list can still grow or be retried.
 */
export type OgcCatalogState =
  | { status: "pending"; data?: DatasetCollection }
  | { status: "success"; data: DatasetCollection }
  | { status: "error"; data?: DatasetCollection; error: Error };

/**
 * Loads the OGC API Records items, accumulating them in `state.data.features`.
 * Changing the language or the query resets the list.
 */
export function useOgcCatalog(
  language: Ref<string>,
  query?: MaybeRefOrGetter<string>,
) {
  const catalogItemsUrl = useCatalogItemsUrl();

  const q = computed(() => toValue(query)?.trim() ?? "");

  const state = ref<OgcCatalogState>({ status: "pending" });

  // Requests are not cancelled, so only the response of the latest one is kept.
  let requestCount = 0;

  async function load(reset: boolean): Promise<void> {
    const request = ++requestCount;
    const previousData = reset ? undefined : state.value.data;
    const offset = previousData?.features.length ?? 0;

    log.debug({
      title: "useOgcCatalog",
      titleColor: LogPreDefinedColor.Yellow,
      messages: [
        "loading catalog page",
        { lang: language.value, offset, q: q.value },
      ],
    });

    state.value = { status: "pending", data: previousData };

    const query: Record<string, string | number> = {
      lang: language.value,
      limit: PAGE_SIZE,
      offset,
    };

    if (q.value) {
      // If a search query is present, use default order (relevance)
      query.q = q.value;
    } else {
      // If no search query is present, order by title
      query.sortby = "title";
    }

    try {
      const page = await $fetch<DatasetCollection>(catalogItemsUrl(), {
        query,
      });
      if (request !== requestCount) {
        return;
      }

      const previousFeatures = previousData?.features ?? [];
      const features = [...previousFeatures, ...page.features];
      state.value = {
        status: "success",
        data: { ...page, features, numberReturned: features.length },
      };
    } catch (error) {
      if (request !== requestCount) {
        return;
      }
      state.value = {
        status: "error",
        data: previousData,
        error: toError(error),
      };
    }
  }

  watch([language, q], () => load(true), { immediate: true });

  const total = computed(() => state.value.data?.numberMatched ?? 0);
  const hasMore = computed(
    () => (state.value.data?.features.length ?? 0) < total.value,
  );

  async function loadMore(): Promise<void> {
    if (state.value.status === "pending" || !hasMore.value) {
      return;
    }
    await load(false);
  }

  async function retry(): Promise<void> {
    if (state.value.status !== "error") {
      return;
    }
    await load(false);
  }

  return { state, total, hasMore, loadMore, retry };
}
