import { describe, expect, it } from "vitest";

import type { Layer } from "@/types";

import { isGeoJSON, isGPX, isKML, isKMZ, isWMS, isWMTS } from "../recordUtils";

function makeLayer(format: Layer["format"]): Layer {
  return {
    format,
    layerId: "test",
    uuid: "uuid-1",
    opacity: 1,
    isVisible: true,
  };
}

describe("isWMTS", () => {
  it("returns true for WMTS format", () => {
    expect(isWMTS(makeLayer("WMTS"))).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isWMTS(makeLayer("WMS"))).toBe(false);
    expect(isWMTS(makeLayer("KML"))).toBe(false);
  });
});

describe("isWMS", () => {
  it("returns true for WMS format", () => {
    expect(isWMS(makeLayer("WMS"))).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isWMS(makeLayer("WMTS"))).toBe(false);
    expect(isWMS(makeLayer("GeoJSON"))).toBe(false);
  });
});

describe("isKML", () => {
  it("returns true for KML format", () => {
    expect(isKML(makeLayer("KML"))).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isKML(makeLayer("KMZ"))).toBe(false);
    expect(isKML(makeLayer("GPX"))).toBe(false);
  });
});

describe("isKMZ", () => {
  it("returns true for KMZ format", () => {
    expect(isKMZ(makeLayer("KMZ"))).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isKMZ(makeLayer("KML"))).toBe(false);
    expect(isKMZ(makeLayer("WMTS"))).toBe(false);
  });
});

describe("isGPX", () => {
  it("returns true for GPX format", () => {
    expect(isGPX(makeLayer("GPX"))).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isGPX(makeLayer("GeoJSON"))).toBe(false);
    expect(isGPX(makeLayer("WMS"))).toBe(false);
  });
});

describe("isGeoJSON", () => {
  it("returns true for GeoJSON format", () => {
    expect(isGeoJSON(makeLayer("GeoJSON"))).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isGeoJSON(makeLayer("WMTS"))).toBe(false);
    expect(isGeoJSON(makeLayer("KML"))).toBe(false);
  });
});
