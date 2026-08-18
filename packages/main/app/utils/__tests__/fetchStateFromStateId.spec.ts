import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";

mockNuxtImport("$fetch", () =>
  vi.fn(() => ({
    state: {},
    deprecated: false,
    warning: "",
  })),
);

describe("fetchStateFromStateId", () => {
  it("makes the call to the state proxy route", async () => {
    const config = await fetchStateFromStateId("stateid");
    expect(config).toEqual({
      state: {},
      deprecated: false,
      warning: "",
    });
  });
});
