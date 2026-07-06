import { describe, expect, it } from "vitest";

import {
  encodeUTM,
  getLetterDesignator,
  inverse,
  latLonToMGRS,
  latLonToUTM,
  toPoint,
} from "../militaryGridProjection";

describe("latLonToUTM", () => {
  it("converts a point in the northern hemisphere", () => {
    const utm = latLonToUTM(47.3769, 8.5417);
    expect(utm.zoneLetter).toBe("T");
    expect(utm.zoneNumber).toBe(32);
    expect(utm.easting).toBeGreaterThan(0);
    expect(utm.northing).toBeGreaterThan(0);
  });

  it("converts a point in the southern hemisphere", () => {
    const utm = latLonToUTM(-33.8688, 151.2093);
    expect(utm.zoneLetter).toBe("H");
    expect(utm.zoneNumber).toBe(56);
    expect(utm.northing).toBeGreaterThan(0);
  });

  it("uses zone 60 for longitude 180", () => {
    const utm = latLonToUTM(0, 180);
    expect(utm.zoneNumber).toBe(60);
  });

  it("uses zone 32 for Norway (56-64N, 3-12E)", () => {
    const utm = latLonToUTM(60, 6);
    expect(utm.zoneNumber).toBe(32);
  });

  it("uses zone 31 for Svalbard (72-84N, 0-9E)", () => {
    const utm = latLonToUTM(76, 4);
    expect(utm.zoneNumber).toBe(31);
  });

  it("uses zone 33 for Svalbard (72-84N, 9-21E)", () => {
    const utm = latLonToUTM(76, 15);
    expect(utm.zoneNumber).toBe(33);
  });

  it("uses zone 35 for Svalbard (72-84N, 21-33E)", () => {
    const utm = latLonToUTM(76, 27);
    expect(utm.zoneNumber).toBe(35);
  });

  it("uses zone 37 for Svalbard (72-84N, 33-42E)", () => {
    const utm = latLonToUTM(76, 37);
    expect(utm.zoneNumber).toBe(37);
  });
});

describe("getLetterDesignator", () => {
  it("returns X for latitudes 72-84", () => {
    expect(getLetterDesignator(72)).toBe("X");
    expect(getLetterDesignator(84)).toBe("X");
    expect(getLetterDesignator(78)).toBe("X");
  });

  it("returns Z for latitudes above 84", () => {
    expect(getLetterDesignator(85)).toBe("Z");
  });

  it("returns Z for latitudes below -80", () => {
    expect(getLetterDesignator(-81)).toBe("Z");
  });

  it("returns correct band letters for mid-range latitudes", () => {
    expect(getLetterDesignator(0)).toBe("N");
    expect(getLetterDesignator(47)).toBe("T");
    expect(getLetterDesignator(-33)).toBe("H");
  });

  it("returns C for the southernmost valid latitude", () => {
    expect(getLetterDesignator(-80)).toBe("C");
  });
});

describe("encodeUTM", () => {
  it("encodes UTM to MGRS with default accuracy 5", () => {
    const utm = latLonToUTM(47.3769, 8.5417);
    const mgrs = encodeUTM(utm);
    expect(mgrs).toMatch(/^\d{2}[A-Z]{3}\d{10}$/);
  });

  it("encodes UTM to MGRS with accuracy 2", () => {
    const utm = latLonToUTM(47.3769, 8.5417);
    const mgrs = encodeUTM(utm, 2);
    expect(mgrs).toMatch(/^\d{2}[A-Z]{3}\d{4}$/);
  });
});

describe("latLonToMGRS", () => {
  it("converts known coordinates to expected MGRS", () => {
    const mgrs = latLonToMGRS(47.3769, 8.5417, 5);
    expect(mgrs).toMatch(/^\d{2}[A-Z]{3}\d{10}$/);
  });

  it("throws for longitude out of range", () => {
    expect(() => latLonToMGRS(0, -181)).toThrow("invalid longitude");
    expect(() => latLonToMGRS(0, 181)).toThrow("invalid longitude");
  });

  it("throws for latitude out of range", () => {
    expect(() => latLonToMGRS(-91, 0)).toThrow("invalid latitude");
    expect(() => latLonToMGRS(91, 0)).toThrow("invalid latitude");
  });

  it("throws for polar regions below 80S", () => {
    expect(() => latLonToMGRS(-81, 0)).toThrow("polar regions");
  });

  it("throws for polar regions above 84N", () => {
    expect(() => latLonToMGRS(85, 0)).toThrow("polar regions");
  });
});

describe("inverse", () => {
  it("returns a bounding box array of 4 numbers", () => {
    const bbox = inverse("32TLM3294697795");
    expect(bbox).toHaveLength(4);
    expect(bbox.every((v) => typeof v === "number")).toBe(true);
  });

  it("returns [lon, lat, lon, lat] for a point-sized MGRS", () => {
    const bbox = inverse("32TLM3294697795");
    expect(bbox[0]).toBeCloseTo(bbox[2], 4);
    expect(bbox[1]).toBeCloseTo(bbox[3], 4);
  });
});

describe("toPoint", () => {
  it("returns [lon, lat] for a valid MGRS string", () => {
    const point = toPoint("32TLM3294697795");
    expect(point).toHaveLength(2);
    expect(typeof point[0]).toBe("number");
    expect(typeof point[1]).toBe("number");
  });

  it("throws for blank string", () => {
    expect(() => toPoint("")).toThrow("blank string");
  });
});

describe("round-trip latLonToMGRS and inverse", () => {
  it("recovers approximate coordinates from MGRS", () => {
    const lat = 47.3769;
    const lon = 8.5417;
    const mgrs = latLonToMGRS(lat, lon, 5);
    const [minLon, minLat, maxLon, maxLat] = inverse(mgrs);

    expect(minLat).toBeLessThanOrEqual(lat);
    expect(maxLat).toBeGreaterThanOrEqual(lat);
    expect(minLon).toBeLessThanOrEqual(lon);
    expect(maxLon).toBeGreaterThanOrEqual(lon);
  });
});
