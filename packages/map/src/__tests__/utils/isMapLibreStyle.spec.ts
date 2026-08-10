import { describe, expect, it } from "vitest";

import { isMapLibreStyle } from "@/utils/geoadminToMapLibreStyle";

describe("isMapLibreStyle", () => {
  it("recognises a standard MapLibre style", () => {
    expect(isMapLibreStyle({ version: 8, sources: {}, layers: [] })).toBe(true);
  });

  it.each([
    ["single", { type: "single", property: "x" }],
    ["unique", { type: "unique", property: "x", values: [] }],
    ["range", { type: "range", property: "x", ranges: [] }],
  ])("rejects a legacy geoadmin literals style (%s)", (_label, style) => {
    expect(isMapLibreStyle(style)).toBe(false);
  });

  it.each([
    ["empty object", {}],
    ["null", null],
    ["missing layers array", { version: 8, sources: {} }],
    ["version not a number", { version: "8", sources: {}, layers: [] }],
  ])("rejects %s", (_label, style) => {
    expect(isMapLibreStyle(style)).toBe(false);
  });
});
