import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

mockNuxtImport("$fetch", () => mockFetch);
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { shareServiceUrl: "https://state.example.test/state" },
}));

const response = {
  state: { map: { center: [1, 1], zoom: 1 }, layers: [] },
  deprecated: false,
  warning: "",
};

describe("fetchStateFromStateId", () => {
  it("calls the state service directly", async () => {
    mockFetch.mockResolvedValue(response);

    const config = await fetchStateFromStateId("stateid");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://state.example.test/state/stateid",
    );
    expect(config).toEqual(response);
  });
});
