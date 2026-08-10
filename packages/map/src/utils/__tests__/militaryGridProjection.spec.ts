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

describe("getMinNorthing via inverse decoding", () => {
  it.each([
    ["C", "01CAA0000000000"],
    ["D", "01DAA0000000000"],
    ["E", "01EAA0000000000"],
    ["F", "01FAA0000000000"],
    ["G", "01GAA0000000000"],
    ["H", "01HAA0000000000"],
    ["J", "01JAA0000000000"],
    ["K", "01KAA0000000000"],
    ["L", "01LAA0000000000"],
    ["M", "01MAA0000000000"],
    ["P", "01PAA0000000000"],
    ["Q", "01QAA0000000000"],
    ["R", "01RAA0000000000"],
    ["S", "01SAA0000000000"],
    ["T", "01TAA0000000000"],
    ["U", "01UAA0000000000"],
    ["V", "01VAA0000000000"],
    ["W", "01WAA0000000000"],
    ["X", "01XAA0000000000"],
  ])("returns a finite latitude for zone %s MGRS", (_zone, mgrs) => {
    const lat = mgrsToLatLon(mgrs);
    expect(typeof lat).toBe("number");
    expect(Number.isFinite(lat)).toBe(true);
  });
});

describe("southern hemisphere decoding", () => {
  it("decodes southern hemisphere MGRS with correct latitude sign", () => {
    const mgrs = latLonToMGRS(-33.8688, 151.2093, 5);
    const [lon, lat] = inverse(mgrs);
    expect(lat).toBeLessThan(0);
    expect(lon).toBeGreaterThan(140);
    expect(lon).toBeLessThan(160);
  });

  it("decodes zone H MGRS from southern hemisphere", () => {
    const lat = mgrsToLatLon("56HJE6390022780");
    expect(lat).toBeLessThan(0);
  });
});

describe("decodeUTM error paths", () => {
  it.each([
    ["A", "01AAA0000000000"],
    ["B", "01BAA0000000000"],
    ["I", "01IAA0000000000"],
    ["O", "01OAA0000000000"],
    ["Y", "01YAA0000000000"],
    ["Z", "01ZAA0000000000"],
  ])("throws for MGRS with invalid zone letter %s", (_letter, mgrs) => {
    expect(() => inverse(mgrs)).toThrow("MGRSPoint zone letter");
  });

  it("throws for MGRS with odd number of digits", () => {
    expect(() => inverse("32TLM329469779")).toThrow("even number of digits");
  });

  it("throws for MGRS with too many digits before zone letter", () => {
    expect(() => inverse("123TLM3294697795")).toThrow("bad conversion from");
  });
});

describe("getNorthingFromChar error path", () => {
  it("throws for northing letter > V", () => {
    expect(() => inverse("32TWZ0000000000")).toThrow();
  });
});

describe("get100kSetForZone edge case", () => {
  it("decodes MGRS for zone 6 (zone % 6 === 0)", () => {
    const mgrs = latLonToMGRS(0, -147, 5);
    expect(mgrs).toMatch(/^6/);
    const bbox = inverse(mgrs);
    expect(bbox).toHaveLength(4);
    expect(bbox.every((v) => typeof v === "number")).toBe(true);
  });
});

describe("dead code branches (defensive)", () => {
  it("getLetterDesignator returns Z for extreme latitudes", () => {
    expect(getLetterDesignator(84.1)).toBe("Z");
    expect(getLetterDesignator(-80.1)).toBe("Z");
  });

  it("getLetterDesignator handles exact boundary at -80", () => {
    expect(getLetterDesignator(-80)).toBe("C");
  });

  it("getLetterDesignator handles exact boundary at 84", () => {
    expect(getLetterDesignator(84)).toBe("X");
  });
});

function mgrsToLatLon(mgrs: string): number {
  const [_, lat] = inverse(mgrs);
  return lat;
}
