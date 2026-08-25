import { describe, expect, it } from "vitest";

import { searchCoordinate } from "../../api/coordinateSearch"; // for some reason, the @/api/... doesn't find anything

describe("searchCoordinate", () => {
  it("returns undefined for a query that is not a coordinate", () => {
    expect(searchCoordinate("Bern")).toBeUndefined();
    expect(searchCoordinate("")).toBeUndefined();
  });

  it("returns undefined for a coordinate outside of Switzerland", () => {
    expect(searchCoordinate("48.8584 2.2945")).toBeUndefined();
  });

  it("builds a result out of a LV95 coordinate", () => {
    const result = searchCoordinate("2600389 1199726");

    expect(result).toMatchObject({
      resultType: "COORDINATE",
      coordinate: [2600389, 1199726],
      title: "2'600'389.00, 1'199'726.00",
    });
    expect(result?.zoom).toBeGreaterThan(0);
  });

  it("reprojects other coordinate systems into LV95, and tells which one was recognized", () => {
    const result = searchCoordinate("46.9479 7.4386");

    // Bern, up to a few hundred meters
    expect(result?.coordinate[0]).toBeCloseTo(2600000, -3);
    expect(result?.coordinate[1]).toBeCloseTo(1200000, -3);
    expect(result?.title).toContain("(WGS 84 (lat/lon))");
  });
});
