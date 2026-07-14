import type { Geometry, Circle, Polygon } from "ol/geom";

import { registerProj4 } from "@swissgeo/coordinates";
import { EPSG_4326_WGS84, EPSG_2056_CH1903 } from "@swissgeo/shared";
import { strToU8, zipSync } from "fflate";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import GPX from "ol/format/GPX";
import KML from "ol/format/KML";
import { LineString, MultiLineString, Point } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";

registerProj4(proj4);
register(proj4);

export const exportFormatToMimeType: Record<string, string> = {
  geojson: "application/geo+json",
  "gpx-track": "application/gpx+xml",
  "gpx-route": "application/gpx+xml",
  kml: "application/vnd.google-earth.kml+xml",
  kmz: "application/vnd.google-earth.kmz",
};

/**
 * Export one or multiple OpenLayers features to GeoJSON format.
 */
export function olFeatureToGeoJSON(
  feature: Feature<Geometry> | Feature<Geometry>[],
): string {
  const olGeoJSON = new GeoJSON({
    featureProjection: EPSG_2056_CH1903,
    dataProjection: EPSG_4326_WGS84,
  });

  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: "Polygon",
    },
  );
  return olGeoJSON.writeFeatures(features);
}

export function olFeatureToKMZ(
  feature: Feature<Geometry> | Feature<Geometry>[],
): ArrayBuffer {
  const kmlString = olFeatureToKML(feature);

  const zipBuf = zipSync(
    {
      "doc.kml": strToU8(kmlString),
    },
    {
      level: 6,
    },
  );

  return zipBuf.buffer;
}

/**
 * Export one or multiple OpenLayers features to GPX format.
 */
export function olFeatureToGPX(
  feature: Feature<Geometry> | Feature<Geometry>[],
  mode: "track" | "route" = "track",
): string {
  const geometryType = mode === "route" ? "LineString" : "MultiLineString";
  const olGPX = new GPX();
  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: geometryType,
      polygonsTo: geometryType,
      lineStringsTo: geometryType,
    },
  );

  return olGPX.writeFeatures(features, {
    featureProjection: EPSG_2056_CH1903,
    dataProjection: EPSG_4326_WGS84,
  });
}

/**
 * Export one or multiple OpenLayers features to KML format.
 */
export function olFeatureToKML(
  feature: Feature<Geometry> | Feature<Geometry>[],
): string {
  const olKML = new KML();
  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: "Polygon",
    },
  );

  return olKML.writeFeatures(features, {
    featureProjection: EPSG_2056_CH1903,
    dataProjection: EPSG_4326_WGS84,
  });
}

/**
 * Converts OL circle features to polygon features.
 * This is useful for exporting circle features to formats that do not support circles, such as GeoJSON, GPX, or KML.
 * The result is a polygon feature that approximates the circle with a specified number of segments and a point feature representing the center of the circle.
 */
export function convertCircleToPolygon(
  circle: Feature<Geometry>,
  segments: number = 64,
): [Feature<Polygon>, Feature<Point>] {
  const geometry = circle.getGeometry();
  if (!geometry || geometry.getType() !== "Circle") {
    throw new Error("The provided feature is not a circle.");
  }

  const circleGeometry = geometry as Circle;
  const center = circleGeometry.getCenter();
  const centerFeature = new Feature<Point>(new Point(center));
  const polygonGeometry = fromCircle(circleGeometry, segments);
  const polygonFeature = new Feature<Polygon>(polygonGeometry);
  const properties = circle.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original circle feature to the new polygon feature
  polygonFeature.setProperties(properties);
  centerFeature.setProperties(properties);

  return [polygonFeature, centerFeature];
}

/**
 * Convert a Cicle polygon into a LineString feature and a center point feature.
 * This is mainly intended for serialization formats that do no support circles nor polygons, such as GPX
 */
export function convertCircleToLineString(
  circle: Feature<Geometry>,
  segments: number = 64,
): [Feature<LineString>, Feature<Point>] {
  const geometry = circle.getGeometry();
  if (!geometry || geometry.getType() !== "Circle") {
    throw new Error("The provided feature is not a circle.");
  }

  const circleGeometry = geometry as Circle;
  const center = circleGeometry.getCenter();
  const centerFeature = new Feature<Point>(new Point(center));
  const polygonGeometry = fromCircle(circleGeometry, segments);

  const lineStringFeature = new Feature<LineString>(
    new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
  );
  const properties = circle.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original circle feature to the new line string feature
  lineStringFeature.setProperties(properties);
  centerFeature.setProperties(properties);

  return [lineStringFeature, centerFeature];
}

export function convertCircleToMultiLineString(
  circle: Feature<Geometry>,
  segments: number = 64,
): [Feature<MultiLineString>, Feature<Point>] {
  const geometry = circle.getGeometry();
  if (!geometry || geometry.getType() !== "Circle") {
    throw new Error("The provided feature is not a circle.");
  }

  const circleGeometry = geometry as Circle;
  const center = circleGeometry.getCenter();
  const centerFeature = new Feature<Point>(new Point(center));
  const polygonGeometry = fromCircle(circleGeometry, segments);

  const lineStringFeature = new Feature<MultiLineString>(
    new MultiLineString([
      new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
    ]),
  );
  const properties = circle.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original circle feature to the new line string feature
  lineStringFeature.setProperties(properties);
  centerFeature.setProperties(properties);

  return [lineStringFeature, centerFeature];
}

/**
 * Convert a Polygon feature into a LinearRing feature.
 * This is mainly intended for serialization formats that do not support polygons, such as GPX.
 */
export function convertPolygonToLineString(
  polygon: Feature<Geometry>,
): Feature<LineString> {
  const geometry = polygon.getGeometry();
  if (!geometry || geometry.getType() !== "Polygon") {
    throw new Error("The provided feature is not a polygon.");
  }

  const polygonGeometry = geometry as Polygon;
  const lineStringFeature = new Feature<LineString>(
    new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
  );
  const properties = polygon.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original polygon feature to the new line string feature
  lineStringFeature.setProperties(properties);

  return lineStringFeature;
}

export function convertPolygonToMultiLineString(
  polygon: Feature<Geometry>,
): Feature<MultiLineString> {
  const geometry = polygon.getGeometry();
  if (!geometry || geometry.getType() !== "Polygon") {
    throw new Error("The provided feature is not a polygon.");
  }

  const polygonGeometry = geometry as Polygon;
  const lineStringFeature = new Feature<MultiLineString>(
    new MultiLineString([
      new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
    ]),
  );
  const properties = polygon.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original polygon feature to the new line string feature
  lineStringFeature.setProperties(properties);

  return lineStringFeature;
}

export function convertLineStringToMultiLineString(
  lineString: Feature<Geometry>,
): Feature<MultiLineString> {
  const geometry = lineString.getGeometry();
  if (!geometry || geometry.getType() !== "LineString") {
    throw new Error("The provided feature is not a line string.");
  }

  const lineStringGeometry = geometry as LineString;
  const multiLineStringFeature = new Feature<MultiLineString>(
    new MultiLineString([lineStringGeometry.getCoordinates()]),
  );
  const properties = lineString.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original line string feature to the new multi-line string feature
  multiLineStringFeature.setProperties(properties);

  return multiLineStringFeature;
}

/**
 * Clones OpenLayers features to ensure they are compatible with serialization formats like GeoJSON, GPX, and KML.
 * Circle features are converted to polygon features and center point features, as these formats do not support circles.
 * Other feature types are cloned as is.
 */
export function cloneToSerializationCompatibleFeatures(
  features: Feature<Geometry>[],
  options: {
    circlesTo?: "Polygon" | "LineString" | "MultiLineString";
    polygonsTo?: "LineString" | "MultiLineString";
    lineStringsTo?: "LineString" | "MultiLineString";
  } = {},
): Feature<Geometry>[] {
  const clonedFeatures: Feature<Geometry>[] = [];

  for (const feature of features) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      continue;
    }

    if (geometry.getType() === "Circle" && options.circlesTo === "Polygon") {
      // Convert circle to polygon and center point
      const [polygonFeature, centerFeature] = convertCircleToPolygon(feature);
      clonedFeatures.push(polygonFeature, centerFeature);
      continue; // Skip adding the original circle feature
    }

    if (geometry.getType() === "Circle" && options.circlesTo === "LineString") {
      // Convert circle to line string and center point
      const [lineStringFeature, centerFeature] =
        convertCircleToLineString(feature);
      clonedFeatures.push(lineStringFeature, centerFeature);
      continue; // Skip adding the original circle feature
    }

    if (
      geometry.getType() === "Circle" &&
      options.circlesTo === "MultiLineString"
    ) {
      // Convert circle to multi-line string and center point
      const [multiLineStringFeature, centerFeature] =
        convertCircleToMultiLineString(feature);
      clonedFeatures.push(multiLineStringFeature, centerFeature);
      continue; // Skip adding the original circle feature
    }

    if (
      geometry.getType() === "Polygon" &&
      options.polygonsTo === "LineString"
    ) {
      const lineStringFeature = convertPolygonToLineString(feature);
      clonedFeatures.push(lineStringFeature);
      continue; // Skip adding the original polygon feature
    }

    if (
      geometry.getType() === "Polygon" &&
      options.polygonsTo === "MultiLineString"
    ) {
      const multiLineStringFeature = convertPolygonToMultiLineString(feature);
      clonedFeatures.push(multiLineStringFeature);
      continue; // Skip adding the original polygon feature
    }

    if (
      geometry.getType() === "LineString" &&
      options.lineStringsTo === "MultiLineString"
    ) {
      const multiLineStringFeature =
        convertLineStringToMultiLineString(feature);
      clonedFeatures.push(multiLineStringFeature);
      continue; // Skip adding the original line string feature
    }

    // Clone the feature as is
    const clonedFeature = new Feature<Geometry>(geometry.clone());
    const properties = feature.getProperties();
    delete properties.geometry;
    clonedFeature.setProperties(properties);
    clonedFeatures.push(clonedFeature);
  }

  return clonedFeatures;
}
