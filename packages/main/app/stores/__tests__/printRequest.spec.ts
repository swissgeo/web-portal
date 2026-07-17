import type { PrintRequestCollectionItem } from "~/stores/printRequest";

import { usePrintRequestsStore } from "~/stores/printRequest";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

const STORAGE_KEY = "printRequestsCollection";

function makeRequest(): PrintRequestCollectionItem {
  return {
    requestBody: {
      state_id: "state-1",
      print_format: "a4",
      print_orientation: "landscape",
      print_resolution: 96,
      print_legend: false,
      print_grid: false,
      print_lang: "en",
    },
    lastResponse: {
      status: "open",
      created: "2026-07-03T10:00:00.000Z",
      started: "",
      finished: "",
      reportUrl: "/jobs/1",
    },
    isPolling: false,
    timestamp: 1690000000000,
    networkError: null,
  };
}

describe("printRequest store", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("starts with an empty collection and polling disabled", () => {
    const store = usePrintRequestsStore();

    expect(store.requestCollection).toEqual([]);
    expect(store.isPollingGlobal).toBe(false);
  });

  it("hydrates a persisted request collection", () => {
    const request = makeRequest();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([request]));

    const store = usePrintRequestsStore();

    expect(store.requestCollection).toEqual([request]);
  });

  it.each(["not-json", JSON.stringify({ request: makeRequest() })])(
    "ignores invalid persisted content",
    (persisted) => {
      localStorage.setItem(STORAGE_KEY, persisted);

      expect(usePrintRequestsStore().requestCollection).toEqual([]);
    },
  );

  it("persists collection and nested response changes", async () => {
    const store = usePrintRequestsStore();
    store.requestCollection.push(makeRequest());
    await nextTick();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);

    store.requestCollection[0]!.lastResponse!.status = "finished";
    await nextTick();

    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].lastResponse.status,
    ).toBe("finished");
  });

  it("clears the collection and its persisted value", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeRequest()]));
    const store = usePrintRequestsStore();

    store.clearRequestCollection();

    expect(store.requestCollection).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
