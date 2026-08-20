import { describe, expect, it } from "vitest";

import { coordinateFromString } from "@/coordinateFromString";
import { LV03, LV95, WEBMERCATOR, WGS84 } from "@/proj";

// Bern, Zytglogge, expressed in the different systems
const BERN_LV95 = [2600389, 1199726];
const BERN_LV03 = [600389, 199726];
const BERN_WGS84 = [7.4386, 46.9479];

function expectCoordinate(
  input: string,
  expected: number[],
  epsg: string,
  precision = 3,
) {
  const result = coordinateFromString(input);
  expect(result, `nothing extracted out of "${input}"`).toBeDefined();
  expect(result!.coordinateSystem.epsg).toBe(epsg);
  expect(result!.coordinate[0]).toBeCloseTo(expected[0], precision);
  expect(result!.coordinate[1]).toBeCloseTo(expected[1], precision);
}

describe("coordinateFromString", () => {
  it("returns undefined for anything that is not a coordinate", () => {
    expect(coordinateFromString("")).toBeUndefined();
    expect(coordinateFromString("   ")).toBeUndefined();
    expect(coordinateFromString("Bern")).toBeUndefined();
    expect(coordinateFromString("2600389")).toBeUndefined();
    expect(coordinateFromString("Bahnhofstrasse 12, Zürich")).toBeUndefined();
  });

  describe("LV95", () => {
    it.each([
      "2600389 1199726",
      "2600389, 1199726",
      "2600389;1199726",
      "2600389/1199726",
      "2'600'389 1'199'726",
      "2 600 389 1 199 726",
      "2600389.00, 1199726.00",
      "2600389,00 1199726,00",
    ])("extracts %s", (input) => {
      expectCoordinate(input, BERN_LV95, LV95.epsg, 0);
    });

    it("swaps the axis when the northing comes first", () => {
      expectCoordinate("1199726 2600389", BERN_LV95, LV95.epsg, 0);
    });

    it("ignores a pair outside of every known bounds", () => {
      expect(coordinateFromString("99999999 99999999")).toBeUndefined();
    });
  });

  describe("LV03", () => {
    it("extracts a LV03 pair", () => {
      expectCoordinate("600389 199726", BERN_LV03, LV03.epsg, 0);
    });

    it("swaps the axis when the northing comes first", () => {
      expectCoordinate("199726 600389", BERN_LV03, LV03.epsg, 0);
    });
  });

  describe("WebMercator", () => {
    it("extracts a WebMercator pair", () => {
      expectCoordinate(
        "828088 5933265",
        [828088, 5933265],
        WEBMERCATOR.epsg,
        0,
      );
    });
  });

  describe("WGS84", () => {
    it.each([
      "46.9479 7.4386",
      "46.9479, 7.4386",
      "46,9479 7,4386",
      "46.9479°, 7.4386°",
    ])("extracts %s as lat/lon", (input) => {
      expectCoordinate(input, BERN_WGS84, WGS84.epsg);
    });

    it.each([
      `46° 56' 52.4" 7° 26' 19"`,
      `46° 56' 52.4" N 7° 26' 19" E`,
      `N 46° 56' 52.4" E 7° 26' 19"`,
      `46° 56′ 52.4″ N 7° 26′ 19″ E`,
    ])("extracts %s", (input) => {
      expectCoordinate(input, BERN_WGS84, WGS84.epsg, 3);
    });

    it("uses the hemisphere to know which value is the longitude", () => {
      expectCoordinate(
        `E 7° 26' 19" N 46° 56' 52.4"`,
        BERN_WGS84,
        WGS84.epsg,
        3,
      );
    });

    it("handles southern and western hemispheres", () => {
      expectCoordinate(`33° 51' S 151° 12' E`, [151.2, -33.85], WGS84.epsg, 2);
    });
  });

  describe("UTM", () => {
    it.each([
      "32T 381179 5200557",
      "381179 5200557 32T",
      "381'179 5'200'557 (32T)",
    ])("extracts %s", (input) => {
      expectCoordinate(input, BERN_WGS84, WGS84.epsg, 2);
    });

    it("does not read a plain pair as UTM", () => {
      const result = coordinateFromString("381179 5200557");
      expect(result?.coordinateSystem.epsg).toBe(WEBMERCATOR.epsg);
    });
  });

  describe("MGRS", () => {
    it.each(["32TLT8117900557", "32TLT 81179 00557", "32tlt8117900557"])(
      "extracts %s",
      (input) => {
        expectCoordinate(input, BERN_WGS84, WGS84.epsg, 2);
      },
    );

    it("returns undefined for an invalid MGRS string", () => {
      expect(coordinateFromString("99ZZZ0000000000")).toBeUndefined();
    });
  });
});
