import { describe, expect, it } from "vitest";

import {
  GEOGESSER_MAX_OFFSET,
  GEOGESSER_MAX_POINTS,
  GEOGESSER_PLACES,
  formatGeogesserDistance,
  geogesserDistance,
  geogesserScore,
  isGeogesserTrigger,
  pickGeogesserTarget,
} from "../geogesser";

describe("geogesser", () => {
  it.each`
    query                  | expected
    ${"geoguessinggame"}   | ${true}
    ${" GeoGuessingGame "} | ${true}
    ${"geo"}               | ${false}
    ${"geoguessing"}       | ${false}
  `("recognizes $query as the trigger: $expected", ({ query, expected }) => {
    expect(isGeogesserTrigger(query)).toBe(expected);
  });

  it("picks a place and keeps the target near its center", () => {
    const place = GEOGESSER_PLACES[0]!;
    // 0 picks the first place, then the largest negative offset on both axes
    const target = pickGeogesserTarget(() => 0);
    expect(target.name).toBe(place.name);
    expect(target.coordinate).toEqual([
      place.coordinate[0] - GEOGESSER_MAX_OFFSET,
      place.coordinate[1] - GEOGESSER_MAX_OFFSET,
    ]);
  });

  it("never picks outside the list, also at the top of the random range", () => {
    const target = pickGeogesserTarget(() => 0.999_999);
    expect(target.name).toBe(GEOGESSER_PLACES.at(-1)!.name);
  });

  it("measures the distance in meters", () => {
    expect(
      geogesserDistance([2_600_000, 1_200_000], [2_603_000, 1_204_000]),
    ).toBe(5_000);
  });

  it("gives all points for an exact guess without a bigger view", () => {
    expect(geogesserScore(0, 0)).toBe(GEOGESSER_MAX_POINTS);
  });

  it("gives fewer points for a farther guess", () => {
    expect(geogesserScore(10_000, 0)).toBeLessThan(geogesserScore(1_000, 0));
  });

  it("removes points for each bigger view", () => {
    expect(geogesserScore(0, 1)).toBe(4_250);
    expect(geogesserScore(0, 2)).toBe(3_500);
  });

  it("gives fewer points on an easier level", () => {
    expect(geogesserScore(0, 0, 0.3)).toBe(1_500);
  });

  it("never gives negative points", () => {
    expect(geogesserScore(0, 20)).toBe(0);
  });

  it.each`
    distance  | expected
    ${0}      | ${"0 m"}
    ${999.4}  | ${"999 m"}
    ${1_000}  | ${"1.0 km"}
    ${61_320} | ${"61.3 km"}
  `("shows $distance m as $expected", ({ distance, expected }) => {
    expect(formatGeogesserDistance(distance)).toBe(expected);
  });
});
