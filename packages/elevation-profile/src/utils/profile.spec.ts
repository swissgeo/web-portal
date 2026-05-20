import { registerProj4 } from "@swissgeo/coordinates";
import proj4 from "proj4";
import { describe, expect, it } from "vitest";

import { makeProfile } from "@/test/fixtures";
import { buildCSV, reverseProfile } from "@/utils/profile";

registerProj4(proj4);

describe("reverseProfile", () => {
  it("does not mutate the original profile", () => {
    const original = makeProfile();
    const originalPointsCopy = original.points.map((p) => ({ ...p }));
    reverseProfile(original);
    expect(original.points).toEqual(originalPointsCopy);
  });

  it("reverses the order of points", () => {
    const result = reverseProfile(makeProfile());
    expect(result.points[0].coordinate).toEqual([2601000, 1200000]);
    expect(result.points[2].coordinate).toEqual([2600000, 1200000]);
  });

  it("recalculates dist values so they start at 0", () => {
    const result = reverseProfile(makeProfile());
    expect(result.points[0].dist).toBe(0);
    expect(result.points[1].dist).toBe(500);
    expect(result.points[2].dist).toBe(1000);
  });

  it("negates elevationDifference", () => {
    const result = reverseProfile(makeProfile());
    expect(result.metadata.elevationDifference).toBe(-100);
  });

  it("swaps totalAscent and totalDescent", () => {
    const result = reverseProfile(makeProfile());
    expect(result.metadata.totalAscent).toBe(0);
    expect(result.metadata.totalDescent).toBe(100);
  });

  it("preserves other metadata fields unchanged", () => {
    const result = reverseProfile(makeProfile());
    expect(result.metadata.minElevation).toBe(400);
    expect(result.metadata.maxElevation).toBe(500);
    expect(result.metadata.totalLinearDist).toBe(1000);
    expect(result.metadata.slopeDistance).toBe(1005);
  });

  it("handles a single-point profile without errors", () => {
    const single = makeProfile({
      points: [
        {
          dist: 0,
          coordinate: [2600000, 1200000],
          elevation: 400,
          hasElevationData: true,
        },
      ],
    });
    const result = reverseProfile(single);
    expect(result.points).toHaveLength(1);
    expect(result.points[0].dist).toBe(0);
  });
});

describe("buildCSV", () => {
  it("produces a header row as the first line", () => {
    const csv = buildCSV(makeProfile());
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toBe(
      "Distance;Altitude;Easting;Northing;Longitude;Latitude",
    );
  });

  it("produces one data row per point", () => {
    const csv = buildCSV(makeProfile());
    const lines = csv.split("\n").filter(Boolean);
    expect(lines).toHaveLength(1 + makeProfile().points.length);
  });

  it("uses semicolons as delimiters", () => {
    const csv = buildCSV(makeProfile());
    const dataLine = csv.split("\n")[1];
    expect(dataLine.split(";")).toHaveLength(6);
  });

  it("includes distance and elevation in each data row", () => {
    const csv = buildCSV(makeProfile());
    const dataLine = csv.split("\n")[1];
    const [dist, altitude] = dataLine.split(";");
    expect(dist).toBe("0");
    expect(altitude).toBe("400");
  });

  it("includes LV95 easting and northing rounded to 2 decimals", () => {
    const csv = buildCSV(makeProfile());
    const dataLine = csv.split("\n")[1];
    const [, , easting, northing] = dataLine.split(";");
    expect(easting).toBe("2600000");
    expect(northing).toBe("1200000");
  });

  it("includes WGS84 longitude and latitude rounded to 6 decimals", () => {
    const csv = buildCSV(makeProfile());
    const dataLine = csv.split("\n")[1];
    const [, , , , lon, lat] = dataLine.split(";");
    expect(Number(lon)).toBeCloseTo(7.438634, 3);
    expect(Number(lat)).toBeCloseTo(46.951083, 3);
  });

  it("ends with a trailing newline", () => {
    const csv = buildCSV(makeProfile());
    expect(csv.endsWith("\n")).toBe(true);
  });
});
