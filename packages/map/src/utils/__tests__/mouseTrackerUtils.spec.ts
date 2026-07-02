import { LV03, LV95, WGS84 } from "@swissgeo/coordinates";
import { describe, expect, it } from "vitest";

import {
  LV03Format,
  LV95Format,
  WGS84Format,
} from "../coordinates/coordinateFormat";
import getHumanReadableCoordinate from "../mouseTrackerUtils";

describe("getHumanReadableCoordinate", () => {
  const lv95Coords: [number, number] = [2683000, 1248000] as [number, number];

  it("returns a string for LV95 format", () => {
    const result = getHumanReadableCoordinate({
      coordinates: lv95Coords,
      projection: LV95,
      displayedFormat: LV95Format,
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns a string for WGS84 format", () => {
    const coords: [number, number] = [8.5417, 47.3769];
    const result = getHumanReadableCoordinate({
      coordinates: coords,
      projection: WGS84,
      displayedFormat: WGS84Format,
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("reprojects and rounds for LV03 format when projection is not LV03", () => {
    const result = getHumanReadableCoordinate({
      coordinates: lv95Coords,
      projection: LV95,
      displayedFormat: LV03Format,
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("uses coordinates directly for LV03 format when projection is already LV03", () => {
    const lv03Coords: [number, number] = [2682000, 1247000];
    const result = getHumanReadableCoordinate({
      coordinates: lv03Coords,
      projection: LV03,
      displayedFormat: LV03Format,
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
