import type { Geometry } from "geojson";

import { LV95, WGS84 } from "@swissgeo/coordinates";
import { describe, expect, it, vi } from "vitest";

import type { FeatureCollectionWithCRS } from "../geoJsonUtils";

import {
  getExtentOfGeometries,
  reprojectGeoJsonData,
  reprojectGeoJsonGeometry,
  transformIntoTurfEquivalent,
} from "../geoJsonUtils";

vi.mock("@swissgeo/log", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("reprojectGeoJsonData", () => {
  const collection: FeatureCollectionWithCRS = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [8.5, 47.3] },
        properties: {},
      },
    ],
  };

  it("returns undefined for falsy input", () => {
    expect(
      reprojectGeoJsonData(null as unknown as FeatureCollectionWithCRS, WGS84),
    ).toBeUndefined();
  });

  it("returns data unchanged when already in target projection", () => {
    const result = reprojectGeoJsonData(collection, WGS84);
    expect(result).toBe(collection);
  });

  it("reprojects when source differs from target", () => {
    const lv95Collection: FeatureCollectionWithCRS = {
      ...collection,
      crs: {
        type: "name",
        properties: { name: "EPSG:2056" },
      },
    };
    const result = reprojectGeoJsonData(lv95Collection, WGS84);
    expect(result).toBeDefined();
    expect(result).not.toBe(lv95Collection);
  });

  it("uses fromProjection when CRS is not in GeoJSON", () => {
    const result = reprojectGeoJsonData(collection, LV95, LV95);
    expect(result).toBe(collection);
  });

  it("defaults to WGS84 when no CRS and no fromProjection", () => {
    const result = reprojectGeoJsonData(collection, WGS84);
    expect(result).toBe(collection);
  });
});

describe("reprojectGeoJsonGeometry", () => {
  const point: Geometry = { type: "Point", coordinates: [8.5, 47.3] };

  it("returns geometry unchanged when source equals target", () => {
    const result = reprojectGeoJsonGeometry(point, WGS84);
    expect(result).toBe(point);
  });

  it("reprojects when fromProjection differs from target", () => {
    const result = reprojectGeoJsonGeometry(point, WGS84, LV95);
    expect(result).toBeDefined();
    expect(result).not.toBe(point);
  });

  it("defaults to WGS84 when no fromProjection", () => {
    const result = reprojectGeoJsonGeometry(point, WGS84);
    expect(result).toBe(point);
  });
});

describe("transformIntoTurfEquivalent", () => {
  it("transforms a Point", () => {
    const result = transformIntoTurfEquivalent({
      type: "Point",
      coordinates: [8.5, 47.3],
    });
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("Point");
  });

  it("transforms a MultiPoint", () => {
    const result = transformIntoTurfEquivalent({
      type: "MultiPoint",
      coordinates: [
        [8.5, 47.3],
        [9.0, 47.5],
      ],
    });
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("MultiPoint");
  });

  it("transforms a LineString", () => {
    const result = transformIntoTurfEquivalent({
      type: "LineString",
      coordinates: [
        [8.5, 47.3],
        [9.0, 47.5],
      ],
    });
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("LineString");
  });

  it("transforms a MultiLineString", () => {
    const result = transformIntoTurfEquivalent({
      type: "MultiLineString",
      coordinates: [
        [
          [8.5, 47.3],
          [9.0, 47.5],
        ],
      ],
    });
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("MultiLineString");
  });

  it("transforms a Polygon", () => {
    const result = transformIntoTurfEquivalent({
      type: "Polygon",
      coordinates: [
        [
          [8.5, 47.3],
          [9.0, 47.3],
          [9.0, 47.5],
          [8.5, 47.5],
          [8.5, 47.3],
        ],
      ],
    });
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("Polygon");
  });

  it("transforms a MultiPolygon", () => {
    const result = transformIntoTurfEquivalent({
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [8.5, 47.3],
            [9.0, 47.3],
            [9.0, 47.5],
            [8.5, 47.5],
            [8.5, 47.3],
          ],
        ],
      ],
    });
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("MultiPolygon");
  });

  it("uses first geometry from GeometryCollection", () => {
    const result = transformIntoTurfEquivalent({
      type: "GeometryCollection",
      geometries: [{ type: "Point", coordinates: [8.5, 47.3] }],
    } as unknown as Geometry);
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("Point");
  });

  it("reprojects from LV95 to WGS84", () => {
    const lv95Point: Geometry = {
      type: "Point",
      coordinates: [2683000, 1248000],
    };
    const result = transformIntoTurfEquivalent(lv95Point, LV95);
    expect(result).toBeDefined();
    expect(result!.geometry.type).toBe("Point");
  });
});

describe("getExtentOfGeometries", () => {
  it("computes bbox for a single point", () => {
    const extent = getExtentOfGeometries([
      { type: "Point", coordinates: [8.5, 47.3] },
    ]);
    expect(extent).toBeDefined();
    expect(extent).toHaveLength(2);
    expect(extent![0]).toHaveLength(2);
    expect(extent![1]).toHaveLength(2);
  });

  it("computes bbox covering multiple geometries", () => {
    const extent = getExtentOfGeometries([
      { type: "Point", coordinates: [8.5, 47.3] },
      { type: "Point", coordinates: [9.0, 47.5] },
    ]);
    expect(extent).toBeDefined();
    expect(extent![0][0]).toBeLessThanOrEqual(8.5);
    expect(extent![1][0]).toBeGreaterThanOrEqual(9.0);
    expect(extent![0][1]).toBeLessThanOrEqual(47.3);
    expect(extent![1][1]).toBeGreaterThanOrEqual(47.5);
  });
});
