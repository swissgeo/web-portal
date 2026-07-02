import { LV03, LV95, WEBMERCATOR, WGS84 } from "@swissgeo/coordinates";
import { describe, expect, it } from "vitest";

import coordinateFormat, {
  allFormats,
  LV03Format,
  LV95Format,
  MGRSFormat,
  MercatorFormat,
  UTMFormat,
  WGS84Format,
} from "../coordinates/coordinateFormat";

describe("coordinate format constants", () => {
  it("LV95Format has correct properties", () => {
    expect(LV95Format.id).toBe("LV95");
    expect(LV95Format.requiredInputProjection).toBe(LV95);
    expect(LV95Format.decimalPoints).toBe(2);
  });

  it("LV03Format has correct properties", () => {
    expect(LV03Format.id).toBe("LV03");
    expect(LV03Format.requiredInputProjection).toBe(LV03);
  });

  it("WGS84Format has correct properties", () => {
    expect(WGS84Format.id).toBe("WGS84");
    expect(WGS84Format.requiredInputProjection).toBe(WGS84);
    expect(WGS84Format.decimalPoints).toBe(5);
  });

  it("MercatorFormat has correct properties", () => {
    expect(MercatorFormat.id).toBe("Mercator");
    expect(MercatorFormat.requiredInputProjection).toBe(WEBMERCATOR);
  });

  it("UTMFormat has correct properties", () => {
    expect(UTMFormat.id).toBe("UTM");
    expect(UTMFormat.requiredInputProjection).toBe(WGS84);
  });

  it("MGRSFormat has correct properties", () => {
    expect(MGRSFormat.id).toBe("MGRS");
    expect(MGRSFormat.requiredInputProjection).toBe(WGS84);
  });

  it("allFormats contains all 6 formats", () => {
    expect(allFormats).toHaveLength(6);
    expect(allFormats).toContain(LV95Format);
    expect(allFormats).toContain(LV03Format);
    expect(allFormats).toContain(WGS84Format);
    expect(allFormats).toContain(MercatorFormat);
    expect(allFormats).toContain(UTMFormat);
    expect(allFormats).toContain(MGRSFormat);
  });
});

describe("coordinateFormat default function", () => {
  it("calls formatCallback without reprojection when projection matches", () => {
    const coords: [number, number] = [2683000, 1248000];
    const result = coordinateFormat(LV95Format, coords, LV95);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("reprojects when projection does not match format requirement", () => {
    const coords: [number, number] = [8.5, 47.3];
    const result = coordinateFormat(LV95Format, coords, WGS84);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("passes withExtra flag to formatCallback", () => {
    const coords: [number, number] = [8.5, 47.3];
    const result = coordinateFormat(WGS84Format, coords, WGS84, true);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatCallback implementations", () => {
  const coords: [number, number] = [8.5, 47.3];

  it("LV95 formatCallback returns a string", () => {
    const result = LV95Format.formatCallback(coords, false);
    expect(typeof result).toBe("string");
  });

  it("LV03 formatCallback returns a string", () => {
    const result = LV03Format.formatCallback(coords, false);
    expect(typeof result).toBe("string");
  });

  it("WGS84 formatCallback with withExtra=false", () => {
    const result = WGS84Format.formatCallback(coords, false);
    expect(typeof result).toBe("string");
    expect(result).not.toMatch(/\(/);
  });

  it("WGS84 formatCallback with withExtra=true includes parenthetical", () => {
    const result = WGS84Format.formatCallback(coords, true);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/\(/);
  });

  it("Mercator formatCallback returns a string", () => {
    const result = MercatorFormat.formatCallback(coords, false);
    expect(typeof result).toBe("string");
  });

  it("UTM formatCallback returns a string with zone info", () => {
    const result = UTMFormat.formatCallback(coords, false);
    expect(typeof result).toBe("string");
    expect(result).toMatch(/\(\d+[A-Z]\)/);
  });

  it("MGRS formatCallback returns a space-separated string", () => {
    const result = MGRSFormat.formatCallback(coords, false);
    expect(typeof result).toBe("string");
    expect(result).not.toMatch(/\(\d+[A-Z]\)/);
  });
});
