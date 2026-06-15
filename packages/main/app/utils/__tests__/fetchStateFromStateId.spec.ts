import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";

mockNuxtImport("useRuntimeConfig", () => {
  return () => ({
    public: {
      shareServiceUrl: "http://swissgeo.ch",
    },
  });
});

vi.stubGlobal("$fetch", () => ({
  state: {},
  version: "0.1",
}));

describe("fetchStateFromStateId", () => {
  it("makes the call to the service shortlink", async () => {
    const config = await fetchStateFromStateId("stateid");
    expect(config).toEqual({
      version: "0.1",
      state: {},
    });
  });
});
