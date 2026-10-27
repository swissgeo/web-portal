import { describe, expect, it } from "vitest";

import { isMapLibreStyleDocument } from "../mapLibreStyle";

const validStyle = {
  version: 8,
  sources: { source: { type: "geojson" } },
  layers: [
    {
      id: "layer",
      type: "circle",
      source: "source",
      paint: { "circle-color": "#ff0000" },
    },
  ],
};

describe("isMapLibreStyleDocument", () => {
  it("accepts a minimal valid style document", () => {
    expect(
      isMapLibreStyleDocument({ version: 8, sources: {}, layers: [] }),
    ).toBe(true);
  });

  it("accepts a fully featured style document", () => {
    expect(isMapLibreStyleDocument(validStyle)).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "style"],
    ["an empty object", {}],
    ["a style without sources", { version: 8, layers: [] }],
    ["a style without layers", { version: 8, sources: {} }],
    ["a style with a non-v8 version", { ...validStyle, version: 9 }],
    [
      "a style with sources as an array",
      { version: 8, sources: [], layers: [] },
    ],
    [
      "a style with layers as an object",
      { version: 8, sources: {}, layers: {} },
    ],
    [
      "a style with a layer without id",
      { version: 8, sources: {}, layers: [{ type: "circle" }] },
    ],
    [
      "a style with a layer without type",
      { version: 8, sources: {}, layers: [{ id: "layer" }] },
    ],
    [
      "a style with a layer as null",
      { version: 8, sources: {}, layers: [null] },
    ],
  ])("rejects %s", (_label, value) => {
    expect(isMapLibreStyleDocument(value)).toBe(false);
  });
});
