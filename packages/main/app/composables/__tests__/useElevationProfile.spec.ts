import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, ref } from "vue";

import { useElevationProfile } from "@/composables/useElevationProfile";

const { fetchMock, showError, logError } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  showError: vi.fn(),
  logError: vi.fn(),
}));

mockNuxtImport("useFetch", () => fetchMock);
mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));
mockNuxtImport("useToaster", () => () => ({ showError }));
vi.mock("@swissgeo/log", () => ({ default: { error: logError } }));

describe("useElevationProfile error reporting", () => {
  let scope: ReturnType<typeof effectScope>;
  let hooks: {
    onRequestError: (_context: { error: Error }) => void;
    onResponseError: (_context: { error: Error }) => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReturnValue({
      data: ref(null),
      pending: ref(false),
      error: ref(undefined),
      execute: vi.fn(),
    });
    scope = effectScope();
    scope.run(() => useElevationProfile(ref(null)));
    hooks = fetchMock.mock.calls[0]![1];
  });

  afterEach(() => scope.stop());

  it("does not report cancellations when a newer geometry replaces the request", () => {
    hooks.onRequestError({
      error: new DOMException(
        "AsyncData request cancelled by unmount",
        "AbortError",
      ),
    });
    hooks.onRequestError({
      error: new DOMException(
        "AsyncData request cancelled by deduplication",
        "AbortError",
      ),
    });

    expect(showError).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it.each([
    new TypeError("Failed to fetch"),
    new DOMException("Request timed out", "TimeoutError"),
  ])("still reports genuine request failures: %s", (error) => {
    hooks.onRequestError({ error });

    expect(showError).toHaveBeenCalledExactlyOnceWith(
      "elevationProfile.fetchError",
    );
    expect(logError).toHaveBeenCalledExactlyOnceWith(
      `Error fetching elevation profile: ${String(error)}`,
    );
  });

  it("still reports unsuccessful server responses", () => {
    hooks.onResponseError({ error: new Error("Internal Server Error") });

    expect(showError).toHaveBeenCalledExactlyOnceWith(
      "elevationProfile.fetchError",
    );
    expect(logError).toHaveBeenCalledOnce();
  });
});
