import type {
  PrintJobStatusResponse,
  PrintPostRequestBody,
  PrintRequestCollectionItem,
} from "~/stores/printRequest";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { usePrintRequests } from "~/composables/usePrintRequests";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

mockNuxtImport("$fetch", () => fetchMock);

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { printServiceUrl: "https://print.example.test/jobs" },
}));

const requestBody: PrintPostRequestBody = {
  state_id: "state-1",
  print_format: "a4",
  print_orientation: "landscape",
  print_resolution: 96,
  print_legend: false,
  print_grid: false,
  print_lang: "en",
};

function makeResponse(
  status: PrintJobStatusResponse["status"],
  created: string,
  reportUrl: string | null = `/reports/${created}`,
): PrintJobStatusResponse {
  return {
    status,
    created,
    started: "",
    finished: "",
    reportUrl,
  };
}

function makeRequest(
  status: PrintJobStatusResponse["status"],
  created: string,
  overrides: Partial<PrintRequestCollectionItem> = {},
): PrintRequestCollectionItem {
  return {
    requestBody,
    timestamp: Date.parse(created),
    networkError: null,
    lastResponse: makeResponse(status, created),
    isPolling: false,
    ...overrides,
  };
}

describe("usePrintRequests", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.useFakeTimers();
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("groups requests by status and sorts newest first", () => {
    const printRequests = usePrintRequests();
    const oldest = makeRequest("finished", "2026-07-01T10:00:00.000Z");
    const newest = makeRequest("started", "2026-07-03T10:00:00.000Z");
    const middle = makeRequest("error", "2026-07-02T10:00:00.000Z");
    const open = makeRequest("open", "2026-06-30T10:00:00.000Z");

    printRequests.requestCollection.value.push(oldest, newest, middle, open);

    expect(printRequests.requestCollectionNewerToOlder.value).toEqual([
      newest,
      middle,
      oldest,
      open,
    ]);
    expect(printRequests.ongoingRequests.value).toEqual([newest, open]);
    expect(printRequests.finishedRequests.value).toEqual([oldest]);
    expect(printRequests.errorRequests.value).toEqual([middle]);
  });

  it("sends a print request and stores the service response", async () => {
    const response = makeResponse("open", "2026-07-03T10:00:00.000Z");
    fetchMock.mockResolvedValueOnce(response);
    const { requestCollection, sendCustomPrintRequest } = usePrintRequests();

    await sendCustomPrintRequest(requestBody);

    expect(fetchMock).toHaveBeenCalledWith("https://print.example.test/jobs", {
      method: "POST",
      body: requestBody,
    });
    expect(requestCollection.value).toEqual([
      {
        requestBody,
        lastResponse: response,
        isPolling: false,
        networkError: null,
        timestamp: expect.any(Number),
      },
    ]);
  });

  it("leaves the collection unchanged when sending fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("service unavailable"));
    const { requestCollection, sendCustomPrintRequest } = usePrintRequests();

    await expect(sendCustomPrintRequest(requestBody)).resolves.toBeUndefined();
    expect(requestCollection.value).toEqual([
      {
        requestBody,
        lastResponse: null,
        isPolling: false,
        networkError: "service unavailable",
        timestamp: expect.any(Number),
      },
    ]);
  });

  it("polls eligible open requests and updates their response", async () => {
    const updated = makeResponse(
      "finished",
      "2026-07-03T10:00:00.000Z",
      "/reports/1",
    );
    fetchMock.mockResolvedValueOnce(updated);
    const { requestCollection } = usePrintRequests();
    const request = makeRequest("open", "2026-07-03T10:00:00.000Z", {
      lastResponse: makeResponse(
        "open",
        "2026-07-03T10:00:00.000Z",
        "/reports/1",
      ),
    });
    requestCollection.value.push(request);

    await vi.advanceTimersByTimeAsync(2000);

    expect(fetchMock).toHaveBeenCalledWith("/reports/1");
    expect(request.lastResponse).toEqual(updated);
    expect(request.isPolling).toBe(false);
  });

  it("does not poll completed, URL-less, or already-polling requests", async () => {
    const { requestCollection } = usePrintRequests();
    requestCollection.value.push(
      makeRequest("finished", "2026-07-03T10:00:00.000Z"),
      makeRequest("open", "2026-07-03T11:00:00.000Z", {
        lastResponse: makeResponse("open", "2026-07-03T11:00:00.000Z", null),
      }),
      makeRequest("started", "2026-07-03T12:00:00.000Z", {
        isPolling: true,
      }),
    );

    await vi.advanceTimersByTimeAsync(2000);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resets the polling flag after a temporary status error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("temporary error"));
    const { requestCollection } = usePrintRequests();
    const request = makeRequest("started", "2026-07-03T10:00:00.000Z");
    requestCollection.value.push(request);

    await vi.advanceTimersByTimeAsync(2000);

    expect(request?.lastResponse?.status).toBe("started");
    expect(request.isPolling).toBe(false);
  });

  it("delegates collection clearing to the store", () => {
    const { clearRequestCollection, requestCollection } = usePrintRequests();
    requestCollection.value.push(
      makeRequest("open", "2026-07-03T10:00:00.000Z"),
    );

    clearRequestCollection();

    expect(requestCollection.value).toEqual([]);
  });
});
