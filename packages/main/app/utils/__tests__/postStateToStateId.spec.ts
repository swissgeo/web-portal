import type { AppState } from "@swissgeo/statesharing";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { shareServiceUrl: "https://state.example.test/state" },
}));

const state: AppState = { map: { center: [1, 1], zoom: 1 }, layers: [] };

describe("postStateToStateId", () => {
  beforeEach(() => {
    vi.stubGlobal("$fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("posts the state to the state service and returns the id", async () => {
    mockFetch.mockResolvedValue({ id: "0123456789abcdef" });

    const signal = new AbortController().signal;
    const id = await postStateToStateId(state, { signal });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://state.example.test/state/",
      {
        method: "POST",
        body: { state },
        signal,
      },
    );
    expect(id).toBe("0123456789abcdef");
  });

  it("returns null when the state service fails", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));

    expect(await postStateToStateId(state)).toBeNull();
  });

  it("returns null when the response does not match the schema", async () => {
    mockFetch.mockResolvedValue({ id: "too-short" });

    expect(await postStateToStateId(state)).toBeNull();
  });
});
