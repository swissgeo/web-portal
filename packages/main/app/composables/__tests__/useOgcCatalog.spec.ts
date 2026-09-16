import type { Dataset, DatasetCollection } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useOgcCatalog } from "../useOgcCatalog";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

mockNuxtImport("$fetch", () => fetchMock);

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: {
    ogcApiEndpoint: "https://api.example.com",
    ogcCatalogCollection: "swissgeo-catalog",
  },
}));

vi.mock("@swissgeo/log", () => ({
  default: { debug: vi.fn() },
  LogPreDefinedColor: { Yellow: "yellow" },
}));

const ITEMS_URL = "https://api.example.com/collections/swissgeo-catalog/items";

function makeDataset(id: string): Dataset {
  return { id, properties: { type: "Dataset", title: id }, links: [] };
}

/** A page of the catalog, out of `numberMatched` records in total */
function makePage(ids: string[], numberMatched: number): DatasetCollection {
  return {
    type: "FeatureCollection",
    features: ids.map(makeDataset),
    links: [],
    numberMatched,
    numberReturned: ids.length,
  };
}

/** A response that only arrives once the test settles it */
function deferred<T>() {
  let resolve!: (_value: T) => void;
  let reject!: (_reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function lastQuery() {
  return fetchMock.mock.lastCall![1].query;
}

function loadedIds(state: ReturnType<typeof useOgcCatalog>["state"]) {
  return state.value.data?.features.map((dataset) => dataset.id);
}

describe("useOgcCatalog", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("loads the first page ordered by title in the given language", async () => {
    fetchMock.mockResolvedValueOnce(makePage(["a", "b"], 2));

    const { state } = useOgcCatalog(ref("fr"));
    expect(state.value.status).toBe("pending");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(ITEMS_URL, {
      query: { lang: "fr", limit: 100, offset: 0, sortby: "title" },
    });
    expect(state.value.status).toBe("success");
    expect(loadedIds(state)).toEqual(["a", "b"]);
  });

  it("searches by relevance when there is a query", async () => {
    fetchMock.mockResolvedValueOnce(makePage(["a"], 1));

    useOgcCatalog(ref("de"), "  forest  ");
    await flushPromises();

    expect(lastQuery()).toEqual({
      lang: "de",
      limit: 100,
      offset: 0,
      q: "forest",
    });
  });

  it("ignores a query made of whitespace only", async () => {
    fetchMock.mockResolvedValueOnce(makePage(["a"], 1));

    useOgcCatalog(ref("de"), () => "   ");
    await flushPromises();

    expect(lastQuery()).toEqual({
      lang: "de",
      limit: 100,
      offset: 0,
      sortby: "title",
    });
  });

  it("appends the next page to the records loaded so far", async () => {
    fetchMock
      .mockResolvedValueOnce(makePage(["a", "b"], 3))
      .mockResolvedValueOnce(makePage(["c"], 3));

    const { state, total, hasMore, loadMore } = useOgcCatalog(ref("de"));
    await flushPromises();
    expect(total.value).toBe(3);
    expect(hasMore.value).toBe(true);

    await loadMore();

    expect(lastQuery()).toMatchObject({ offset: 2 });
    expect(loadedIds(state)).toEqual(["a", "b", "c"]);
    expect(state.value.data?.numberReturned).toBe(3);
    expect(hasMore.value).toBe(false);
  });

  it("keeps the loaded records while the next page is pending, without requesting it twice", async () => {
    const nextPage = deferred<DatasetCollection>();
    fetchMock
      .mockResolvedValueOnce(makePage(["a"], 2))
      .mockReturnValueOnce(nextPage.promise);

    const { state, loadMore } = useOgcCatalog(ref("de"));
    await flushPromises();

    void loadMore();
    expect(state.value.status).toBe("pending");
    expect(loadedIds(state)).toEqual(["a"]);

    void loadMore();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    nextPage.resolve(makePage(["b"], 2));
    await flushPromises();
    expect(loadedIds(state)).toEqual(["a", "b"]);
  });

  it("does not load more once all records are loaded", async () => {
    fetchMock.mockResolvedValueOnce(makePage(["a"], 1));

    const { loadMore } = useOgcCatalog(ref("de"));
    await flushPromises();
    await loadMore();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("starts over when the language changes", async () => {
    fetchMock
      .mockResolvedValueOnce(makePage(["a", "b"], 3))
      .mockResolvedValueOnce(makePage(["c"], 3))
      .mockResolvedValueOnce(makePage(["x"], 1));
    const language = ref("de");

    const { state, total, loadMore } = useOgcCatalog(language);
    await flushPromises();
    await loadMore();

    language.value = "en";
    await flushPromises();

    expect(lastQuery()).toEqual({
      lang: "en",
      limit: 100,
      offset: 0,
      sortby: "title",
    });
    expect(loadedIds(state)).toEqual(["x"]);
    expect(total.value).toBe(1);
  });

  it("starts over when the query changes", async () => {
    fetchMock
      .mockResolvedValueOnce(makePage(["a", "b"], 3))
      .mockResolvedValueOnce(makePage(["c"], 3))
      .mockResolvedValueOnce(makePage(["forest"], 1));
    const query = ref("");

    const { state, loadMore } = useOgcCatalog(ref("de"), query);
    await flushPromises();
    await loadMore();

    query.value = "forest";
    await flushPromises();

    expect(lastQuery()).toEqual({
      lang: "de",
      limit: 100,
      offset: 0,
      q: "forest",
    });
    expect(loadedIds(state)).toEqual(["forest"]);
  });

  it("keeps the loaded records when a page fails, and retries that page", async () => {
    fetchMock
      .mockResolvedValueOnce(makePage(["a"], 2))
      .mockRejectedValueOnce(new Error("catalog down"))
      .mockResolvedValueOnce(makePage(["b"], 2));

    const { state, loadMore, retry } = useOgcCatalog(ref("de"));
    await flushPromises();
    await loadMore();

    expect(state.value).toMatchObject({
      status: "error",
      error: new Error("catalog down"),
    });
    expect(loadedIds(state)).toEqual(["a"]);

    await retry();

    expect(lastQuery()).toMatchObject({ offset: 1 });
    expect(state.value.status).toBe("success");
    expect(loadedIds(state)).toEqual(["a", "b"]);
  });

  it("reports an error when the first page fails", async () => {
    fetchMock.mockRejectedValueOnce("boom");

    const { state, hasMore } = useOgcCatalog(ref("de"));
    await flushPromises();

    expect(state.value).toMatchObject({
      status: "error",
      error: expect.any(Error),
    });
    expect(state.value.data).toBeUndefined();
    expect(hasMore.value).toBe(false);
  });

  it("only retries after an error", async () => {
    fetchMock.mockResolvedValueOnce(makePage(["a"], 2));

    const { retry } = useOgcCatalog(ref("de"));
    await flushPromises();
    await retry();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("ignores the response of an outdated request", async () => {
    const outdated = deferred<DatasetCollection>();
    fetchMock
      .mockReturnValueOnce(outdated.promise)
      .mockResolvedValueOnce(makePage(["forest"], 1));
    const query = ref("fo");

    const { state } = useOgcCatalog(ref("de"), query);
    query.value = "forest";
    await flushPromises();
    expect(loadedIds(state)).toEqual(["forest"]);

    outdated.resolve(makePage(["fo"], 1));
    await flushPromises();

    expect(state.value.status).toBe("success");
    expect(loadedIds(state)).toEqual(["forest"]);
  });

  it("ignores the failure of an outdated request", async () => {
    const outdated = deferred<DatasetCollection>();
    fetchMock
      .mockReturnValueOnce(outdated.promise)
      .mockResolvedValueOnce(makePage(["forest"], 1));
    const query = ref("fo");

    const { state } = useOgcCatalog(ref("de"), query);
    query.value = "forest";
    await flushPromises();

    outdated.reject(new Error("too late"));
    await flushPromises();

    expect(state.value.status).toBe("success");
    expect(loadedIds(state)).toEqual(["forest"]);
  });
});
