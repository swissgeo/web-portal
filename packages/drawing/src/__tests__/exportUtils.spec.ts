import type { Geometry } from "ol/geom";

import { strFromU8, unzipSync } from "fflate";
import Feature from "ol/Feature";
import { Circle, LineString, Point, Polygon } from "ol/geom";
import { describe, expect, it } from "vitest";

import {
  cloneToSerializationCompatibleFeatures,
  convertCircleToLineString,
  convertCircleToMultiLineString,
  convertCircleToPolygon,
  convertLineStringToMultiLineString,
  convertPolygonToLineString,
  convertPolygonToMultiLineString,
  exportFormatToMimeType,
  olFeatureToGeoJSON,
  olFeatureToGPX,
  olFeatureToKML,
  olFeatureToKMZ,
} from "@/utils/exportUtils";

function makeFeature(
  geometry?: Geometry,
  properties: Record<string, unknown> = {},
) {
  const feature = new Feature<Geometry>(geometry);
  feature.setProperties(properties);
  return feature;
}

function getGeometry<T extends Geometry>(feature: Feature<T>): T {
  const geometry = feature.getGeometry();
  if (!geometry) {
    throw new Error("Expected feature to have a geometry");
  }
  return geometry;
}

function makePolygon() {
  return new Polygon([
    [
      [0, 0],
      [4, 0],
      [4, 3],
      [0, 0],
    ],
  ]);
}

describe("export format metadata", () => {
  it("maps supported drawing export formats to their MIME types", () => {
    expect(exportFormatToMimeType).toEqual({
      geojson: "application/geo+json",
      "gpx-track": "application/gpx+xml",
      "gpx-route": "application/gpx+xml",
      kml: "application/vnd.google-earth.kml+xml",
      kmz: "application/vnd.google-earth.kmz",
    });
  });
});

describe("OpenLayers feature serializers", () => {
  it("serializes map-coordinate point features to WGS84 GeoJSON", () => {
    const feature = makeFeature(new Point([2600000, 1200000]), {
      name: "Survey point",
    });

    const geoJson = JSON.parse(olFeatureToGeoJSON(feature));

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0].geometry.type).toBe("Point");
    expect(geoJson.features[0].geometry.coordinates[0]).toBeCloseTo(7.4386, 3);
    expect(geoJson.features[0].geometry.coordinates[1]).toBeCloseTo(46.951, 3);
    expect(geoJson.features[0].properties.name).toBe("Survey point");
  });

  it("converts circles to polygon and center-point features for GeoJSON", () => {
    const feature = makeFeature(new Circle([2600000, 1200000], 100), {
      name: "Inspection radius",
    });

    const geoJson = JSON.parse(olFeatureToGeoJSON(feature));

    expect(geoJson.features).toHaveLength(2);
    expect(
      geoJson.features.map(
        (entry: { geometry: { type: string } }) => entry.geometry.type,
      ),
    ).toEqual(["Polygon", "Point"]);
    expect(
      geoJson.features.map(
        (entry: { properties: { name: string } }) => entry.properties.name,
      ),
    ).toEqual(["Inspection radius", "Inspection radius"]);
  });

  it("serializes GPX tracks and routes with the matching GPX element type", () => {
    const feature = makeFeature(
      new LineString([
        [2600000, 1200000],
        [2600010, 1200010],
      ]),
    );

    expect(olFeatureToGPX(feature, "track")).toContain("<trk>");
    expect(olFeatureToGPX(feature, "route")).toContain("<rte>");
  });

  it("serializes KML and wraps KMZ output in a doc.kml archive", () => {
    const feature = makeFeature(new Point([2600000, 1200000]), {
      name: "KML point",
    });
    const kml = olFeatureToKML(feature);
    const kmz = olFeatureToKMZ(feature);
    const kmzEntries = unzipSync(new Uint8Array(kmz));

    expect(kml).toContain("<kml");
    expect(kml).toContain("<Placemark>");
    expect(Object.keys(kmzEntries)).toEqual(["doc.kml"]);
    expect(strFromU8(kmzEntries["doc.kml"])).toContain("<kml");
  });
});

describe("geometry conversion helpers", () => {
  it("converts circles to polygon and center-point features", () => {
    const [polygonFeature, centerFeature] = convertCircleToPolygon(
      makeFeature(new Circle([10, 20], 5), { name: "Circle" }),
      8,
    );

    expect(getGeometry(polygonFeature).getType()).toBe("Polygon");
    expect(
      getGeometry(polygonFeature).getLinearRing(0).getCoordinates(),
    ).toHaveLength(9);
    expect(getGeometry(centerFeature).getCoordinates()).toEqual([10, 20]);
    expect(polygonFeature.get("name")).toBe("Circle");
    expect(centerFeature.get("name")).toBe("Circle");
  });

  it("converts circles to line-string and center-point features", () => {
    const [lineStringFeature, centerFeature] = convertCircleToLineString(
      makeFeature(new Circle([10, 20], 5), { name: "Circle" }),
      8,
    );

    expect(getGeometry(lineStringFeature).getType()).toBe("LineString");
    expect(getGeometry(lineStringFeature).getCoordinates()).toHaveLength(9);
    expect(getGeometry(centerFeature).getCoordinates()).toEqual([10, 20]);
  });

  it("converts circles to multi-line-string and center-point features", () => {
    const [multiLineStringFeature, centerFeature] =
      convertCircleToMultiLineString(
        makeFeature(new Circle([10, 20], 5), { name: "Circle" }),
        8,
      );

    expect(getGeometry(multiLineStringFeature).getType()).toBe(
      "MultiLineString",
    );
    expect(
      getGeometry(multiLineStringFeature).getCoordinates()[0],
    ).toHaveLength(9);
    expect(getGeometry(centerFeature).getCoordinates()).toEqual([10, 20]);
  });

  it("converts polygons to line strings from their outer ring", () => {
    const lineStringFeature = convertPolygonToLineString(
      makeFeature(makePolygon(), { name: "Polygon" }),
    );

    expect(getGeometry(lineStringFeature).getCoordinates()).toEqual(
      makePolygon().getLinearRing(0).getCoordinates(),
    );
    expect(lineStringFeature.get("name")).toBe("Polygon");
  });

  it("converts polygons to multi-line strings from their outer ring", () => {
    const multiLineStringFeature = convertPolygonToMultiLineString(
      makeFeature(makePolygon(), { name: "Polygon" }),
    );

    expect(getGeometry(multiLineStringFeature).getCoordinates()).toEqual([
      makePolygon().getLinearRing(0).getCoordinates(),
    ]);
    expect(multiLineStringFeature.get("name")).toBe("Polygon");
  });

  it("converts line strings to single-part multi-line strings", () => {
    const coordinates = [
      [0, 0],
      [3, 4],
    ];

    const multiLineStringFeature = convertLineStringToMultiLineString(
      makeFeature(new LineString(coordinates), { name: "Line" }),
    );

    expect(getGeometry(multiLineStringFeature).getCoordinates()).toEqual([
      coordinates,
    ]);
    expect(multiLineStringFeature.get("name")).toBe("Line");
  });

  it("throws when conversion helpers receive the wrong geometry type", () => {
    const pointFeature = makeFeature(new Point([0, 0]));

    expect(() => convertCircleToPolygon(pointFeature)).toThrow(
      "The provided feature is not a circle.",
    );
    expect(() => convertCircleToLineString(pointFeature)).toThrow(
      "The provided feature is not a circle.",
    );
    expect(() => convertCircleToMultiLineString(pointFeature)).toThrow(
      "The provided feature is not a circle.",
    );
    expect(() => convertPolygonToLineString(pointFeature)).toThrow(
      "The provided feature is not a polygon.",
    );
    expect(() => convertPolygonToMultiLineString(pointFeature)).toThrow(
      "The provided feature is not a polygon.",
    );
    expect(() => convertLineStringToMultiLineString(pointFeature)).toThrow(
      "The provided feature is not a line string.",
    );
  });
});

describe("cloneToSerializationCompatibleFeatures", () => {
  it.each(["Polygon", "LineString", "MultiLineString"] as const)(
    "converts circles to %s-compatible geometries and center points",
    (circlesTo) => {
      const [convertedFeature, centerFeature] =
        cloneToSerializationCompatibleFeatures(
          [makeFeature(new Circle([10, 20], 5), { name: "Circle" })],
          { circlesTo },
        );

      expect(getGeometry(convertedFeature).getType()).toBe(circlesTo);
      expect(getGeometry(centerFeature).getType()).toBe("Point");
      expect(convertedFeature.get("name")).toBe("Circle");
      expect(centerFeature.get("name")).toBe("Circle");
    },
  );

  it.each(["LineString", "MultiLineString"] as const)(
    "converts polygons to %s-compatible geometries",
    (polygonsTo) => {
      const [convertedFeature] = cloneToSerializationCompatibleFeatures(
        [makeFeature(makePolygon(), { name: "Polygon" })],
        { polygonsTo },
      );

      expect(getGeometry(convertedFeature).getType()).toBe(polygonsTo);
      expect(convertedFeature.get("name")).toBe("Polygon");
    },
  );

  it("converts line strings to multi-line strings when requested", () => {
    const [convertedFeature] = cloneToSerializationCompatibleFeatures(
      [
        makeFeature(
          new LineString([
            [0, 0],
            [3, 4],
          ]),
          { name: "Line" },
        ),
      ],
      { lineStringsTo: "MultiLineString" },
    );

    expect(getGeometry(convertedFeature).getType()).toBe("MultiLineString");
    expect(convertedFeature.get("name")).toBe("Line");
  });

  it("skips features without geometry", () => {
    const pointFeature = makeFeature(new Point([1, 2]));

    const clonedFeatures = cloneToSerializationCompatibleFeatures([
      makeFeature(),
      pointFeature,
    ]);

    expect(clonedFeatures).toHaveLength(1);
    expect(getGeometry(clonedFeatures[0]).getType()).toBe("Point");
  });

  it("clones supported features without sharing the original geometry", () => {
    const originalGeometry = new Point([1, 2]);
    const [clonedFeature] = cloneToSerializationCompatibleFeatures([
      makeFeature(originalGeometry, { name: "Original" }),
    ]);

    expect(clonedFeature.get("name")).toBe("Original");
    expect(getGeometry(clonedFeature)).not.toBe(originalGeometry);

    (getGeometry(clonedFeature) as Point).translate(10, 10);

    expect(originalGeometry.getCoordinates()).toEqual([1, 2]);
  });
});
