import type { Coordinate } from "ol/coordinate";
import type Feature from "ol/Feature";
import type {
  Circle,
  Geometry,
  LinearRing,
  LineString,
  Point,
  Polygon,
} from "ol/geom";

import { registerProj4, WGS84, LV95 } from "@swissgeo/coordinates";
import proj4 from "proj4";

registerProj4(proj4);

/**
 * Type to describe the metrics related to a Point feature
 */
export type PointMetrics = {
  coordinate: Coordinate;
  coordinatesWgs84: Coordinate;
};

/**
 * Type to describe the metrics related to a LineString feature
 */
export type LineStringMetrics = {
  lengthMeters: number;
};

/**
 * Type to describe the metrics related to a Polygon feature
 */
export type PolygonMetrics = {
  areaSquareMeters: number;
  perimeterMeters: number;
};

/**
 * Type to describe the metrics related to a Circle feature
 */
export type CircleMetrics = {
  center: Coordinate;
  centerWgs84: Coordinate;
  radiusMeters: number;
  areaSquareMeters: number;
  perimeterMeters: number;
};

/**
 * Type to describe the metrics related to the currently focused feature, depending on its geometry type. It can be null if no feature is focused.
 */
export type FocusedFeatureMetrics =
  | PointMetrics
  | LineStringMetrics
  | PolygonMetrics
  | CircleMetrics
  | null;

/**
 * Get the length of a LinearRing geometry in map units.
 * This is asumed that the projection uses metric units, as the drawing module is designed for Swiss projections which are metric.
 */
export function getLinearRingLength(linearRing: LinearRing): number {
  let length = 0;
  const lrCoordinates = linearRing.getCoordinates();
  for (let i = 0; i < lrCoordinates.length - 1; i++) {
    const start = lrCoordinates[i];
    const end = lrCoordinates[i + 1];

    length += Math.sqrt((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2);
  }
  return length;
}

/**
 * Compute the metrics related to the focused feature, depending on its geometry type.
 */
export function computeFocusedFeatureMetrics(
  feature: Feature<Geometry>,
): FocusedFeatureMetrics {
  if (!feature) {
    return null;
  }

  const geometry = feature.getGeometry();

  if (!geometry) {
    return null;
  }

  switch (geometry.getType()) {
    case "Point": {
      const coordinates = (geometry as Point).getCoordinates();
      const coordinatesWgs84 = proj4(LV95.epsg, WGS84.epsg, coordinates);
      return { coordinate: coordinates, coordinatesWgs84 };
    }

    case "LineString": {
      const lengthMeters = (geometry as LineString).getLength();
      return { lengthMeters };
    }

    case "Polygon": {
      const areaSquareMeters = (geometry as Polygon).getArea();
      const perimeterMeters = getLinearRingLength(
        (geometry as Polygon).getLinearRing(0),
      );

      return { areaSquareMeters, perimeterMeters };
    }
    case "Circle": {
      const center = (geometry as Circle).getCenter();
      const centerWgs84 = proj4(LV95.epsg, WGS84.epsg, center);
      const radiusMeters = (geometry as Circle).getRadius();

      const areaSquareMeters = Math.PI * radiusMeters * radiusMeters;
      const perimeterMeters = 2 * Math.PI * radiusMeters;
      return {
        center,
        centerWgs84,
        radiusMeters,
        areaSquareMeters,
        perimeterMeters,
      };
    }
    default:
      return null;
  }
}
