import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("$fetch", () => ({
  state: {},
  deprecated: false,
  warning: "",
}));

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
