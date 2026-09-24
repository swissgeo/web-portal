// The notations under test are the ones web-mapviewer covers, see the link in
// coordinateFromString.ts.

import { describe, expect, it } from "vitest";

import { coordinateFromString } from "@/coordinateFromString";
import { LV03, LV95, WEBMERCATOR, WGS84 } from "@/proj";

// Bern, Zytglogge, expressed in the different systems
const BERN_LV95 = [2600696, 1199664];
const BERN_LV03 = [600696, 199664];
const BERN_WGS84 = [7.447778, 46.948056];

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
    expect(coordinateFromString("2600696")).toBeUndefined();
    expect(coordinateFromString("Bahnhofstrasse 12, Zürich")).toBeUndefined();
  });

  describe("LV95", () => {
    it.each([
      "2600696 1199664",
      "2600696, 1199664",
      "2600696;1199664",
      "2600696/1199664",
      "2'600'696 1'199'664",
      "2 600 696 1 199 664",
      "2`600`696 1`199`664",
      "2600696.00, 1199664.00",
      "2600696,00 1199664,00",
    ])("extracts %s", (input) => {
      expectCoordinate(input, BERN_LV95, LV95.epsg, 0);
    });

    it("swaps the axis when the northing comes first", () => {
      expectCoordinate("1199664 2600696", BERN_LV95, LV95.epsg, 0);
    });

    it("ignores a pair outside of every known bounds", () => {
      expect(coordinateFromString("99999999 99999999")).toBeUndefined();
    });
  });

  describe("LV03", () => {
    it("extracts a LV03 pair", () => {
      expectCoordinate("600696 199664", BERN_LV03, LV03.epsg, 0);
    });

    it("swaps the axis when the northing comes first", () => {
      expectCoordinate("199664 600696", BERN_LV03, LV03.epsg, 0);
    });
  });

  describe("WebMercator", () => {
    it("extracts a WebMercator pair", () => {
      expectCoordinate(
        "829083 5933600",
        [829083, 5933600],
        WEBMERCATOR.epsg,
        0,
      );
    });
  });

  describe("WGS84", () => {
    it("reads the value above 90 as the longitude", () => {
      // no hemisphere to tell us, so the bounds decide: 170 can only be a longitude
      expectCoordinate("170.5 45.2", [170.5, 45.2], WGS84.epsg);
    });

    it("ignores comma decimals that are no pair of numbers", () => {
      expect(coordinateFromString("1234 5,6 7890 1,2")).toBeUndefined();
    });

    it("ignores a small pair that is no latitude and longitude", () => {
      expect(coordinateFromString("100 100")).toBeUndefined();
    });

    it("ignores degrees outside of the world", () => {
      expect(coordinateFromString("200° 100°")).toBeUndefined();
    });

    it.each([
      "46.948056 7.447778",
      "46.948056, 7.447778",
      "46,948056 7,447778",
      "46.948056°, 7.447778°",
    ])("extracts %s as lat/lon", (input) => {
      expectCoordinate(input, BERN_WGS84, WGS84.epsg);
    });

    it("reads a pair as lon/lat when only that order is in Switzerland", () => {
      expectCoordinate("7.447778 46.948056", BERN_WGS84, WGS84.epsg);
    });

    it.each([
      // degrees and minutes, as swisstopo and google write them
      `46° 56.8834' 7° 26.8667'`,
      `46° 56.8834' N 7° 26.8667' E`,
      "46 56.8834 7 26.8667",
      // degrees, minutes and seconds without any symbol, the google notation
      "46 56 53 7 26 52",
      "46 56 53 N 7 26 52 E",
      "N 46 56 53 E 7 26 52",
      // the typographic variants of the minute and second symbols
      `46° 56‘ 53“ 7° 26‘ 52“`,
      `46° 56′ 53′′ 7° 26′ 52′′`,
      `46° 56' 53'' 7° 26' 52''`,
      // and the ones we print ourselves
      `46° 56' 53" 7° 26' 52"`,
      `46° 56' 53" N 7° 26' 52" E`,
      `N 46° 56' 53" E 7° 26' 52"`,
      `46° 56′ 53″ N 7° 26′ 52″ E`,
    ])("extracts %s", (input) => {
      expectCoordinate(input, BERN_WGS84, WGS84.epsg, 3);
    });

    it("uses the hemisphere to know which value is the longitude", () => {
      expectCoordinate(`E 7° 26' 52" N 46° 56' 53"`, BERN_WGS84, WGS84.epsg, 3);
    });

    it("handles southern and western hemispheres", () => {
      expectCoordinate(`33° 51' S 151° 12' E`, [151.2, -33.85], WGS84.epsg, 2);
    });
  });

  describe("UTM", () => {
    it.each([
      "32T 381878 5200561",
      "381878 5200561 32T",
      "381'878 5'200'561 (32T)",
    ])("extracts %s", (input) => {
      expectCoordinate(input, BERN_WGS84, WGS84.epsg, 2);
    });

    it("returns undefined for an impossible UTM zone", () => {
      expect(coordinateFromString("99X 381878 5200561")).toBeUndefined();
    });

    it("does not read a plain pair as UTM", () => {
      const result = coordinateFromString("381878 5200561");
      expect(result?.coordinateSystem.epsg).toBe(WEBMERCATOR.epsg);
    });
  });

  describe("MGRS", () => {
    it.each(["32TLT8187800561", "32TLT 81878 00561", "32tlt8187800561"])(
      "extracts %s",
      (input) => {
        expectCoordinate(input, BERN_WGS84, WGS84.epsg, 2);
      },
    );

    it.each(["99ZZZ0000000000", "99XZZ0000"])(
      "returns undefined for the invalid MGRS string %s",
      (input) => {
        expect(coordinateFromString(input)).toBeUndefined();
      },
    );
  });
});
