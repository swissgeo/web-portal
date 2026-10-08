import type { DatasetCollection } from "@/types/Records";

export interface CatalogItemsOptions {
  /** Language code (de, fr, etc.) */
  lang: string;
  /** Maximum number of records to return */
  limit: number;
  /** Search text, matched as a substring; surrounding whitespace is ignored */
  q?: string;
  /** Number of records to skip (default: 0) */
  offset?: number;
  /** Optional abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Load a page of records from the OGC API Records catalog `/items` endpoint.
 *
 * With a search text, the records are matched server-side through the `q`
 * full-text parameter and come back in the default order (relevance). Without
 * one, they are ordered by title.
 *
 * Errors (including a non-ok response) are propagated so callers can
 * distinguish a failed request from an empty result set.
 *
 * @param itemsUrl - The catalog `/items` endpoint (without query parameters)
 * @param options - Language, paging and search options
 */
export async function fetchCatalogItems(
  itemsUrl: string,
  options: CatalogItemsOptions,
): Promise<DatasetCollection> {
  const { lang, limit, offset = 0, signal } = options;
  const q = options.q?.trim() ?? "";

  const url = new URL(itemsUrl);
  url.searchParams.set("lang", lang);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  if (q) {
    // If a search query is present, use default order (relevance). The
    // wildcards make the catalog match substrings instead of whole words only
    // (e.g. `ssigba` finds `Essigbaum`).
    url.searchParams.set("q", `*${q}*`);
  } else {
    // If no search query is present, order by title
    url.searchParams.set("sortby", "title");
  }

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error(`Catalog items API error: ${response.status}`);
  }

  return (await response.json()) as DatasetCollection;
}
