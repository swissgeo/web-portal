import type { NormalizedExtent, CoordinateSystem } from "@swissgeo/coordinates";
import type { Feature, FeatureCollection, Geometry } from "geojson";

import {
  allCoordinateSystems,
  extentUtils,
  WGS84,
} from "@swissgeo/coordinates";
import log from "@swissgeo/log";
import {
  bbox,
  featureCollection,
  lineString,
  multiLineString,
  multiPoint,
  multiPolygon,
  point,
  polygon,
} from "@turf/turf";
import { reproject } from "reproject";

/**
 * The `crs` property in geoJSON is obsolete and all geoJSONs shoud be in WGS84,
 *
 * In our backend, we still have geoJSON layers which are in LV95 and that have a
 *
 * `crs` property to tell the frontend the base projection.
 */

export interface FeatureCollectionWithCRS extends FeatureCollection {
  crs?: {
    type: "name";

    properties: {
      name: string;
    };
  };
}

/**
 * Re-projecting the GeoJSON data (FeatureCollection) if not in the wanted projection
 *
 * The default projection for GeoJSON is WGS84 as stated in the reference
 * https://tools.ietf.org/html/rfc7946#section-4
 *
 * This function will look first in the GeoJSON own CRS property, to determine which projection
 * system is used to describe the coordinate. If no CRS is defined, it will default to the given
 * fromProjection, and if nothing is found in both places it will default to WGS84.
 *
 * @param geoJsonData GeoJSON data (FeatureCollection) to be reprojected
 * @param toProjection Wanted projection for these data
 * @param fromProjection Source projection, in which the data is being described (or `undefined` if
 *   none were set in the GeoJSON data, meaning it is described with WGS84)
 */
export function reprojectGeoJsonData(
  geoJsonData: FeatureCollectionWithCRS,
  toProjection: CoordinateSystem,
  fromProjection?: CoordinateSystem,
): FeatureCollection | undefined {
  if (!geoJsonData) {
    return undefined;
  }
  const matchingProjection: CoordinateSystem =
    // if the GeoJSON describes a CRS (projection) we grab it so that we can reproject on the fly if needed

    allCoordinateSystems.find(
      (coordinateSystem: CoordinateSystem) =>
        coordinateSystem.epsg === geoJsonData.crs?.properties?.name,
    ) ??
    // if no projection is given by the GeoJSON we use the one given as param
    // GeoJSONs don't give CRS anymore, since some later revision (see https://datatracker.ietf.org/doc/html/rfc7946#appendix-B.1)
    fromProjection ??
    // if nothing is found in the GeoJSON or the param value, we default to WGS84
    // according to the IETF reference, if nothing is said about the projection used, it should be WGS84
    WGS84;
  if (matchingProjection.epsg !== toProjection.epsg) {
    log.debug("Reprojecting JSON data", geoJsonData);
    return reproject(geoJsonData, matchingProjection.epsg, toProjection.epsg);
  }
  // it's already in the correct projection, we don't re-project
  return geoJsonData;
}

/**
 * Re-projecting the GeoJSON if not in the wanted projection
 *
 * The default projection for GeoJSON is WGS84 as stated in the reference
 * https://tools.ietf.org/html/rfc7946#section-4
 *
 * This function will look first in the GeoJSON own CRS property, to determine which projection
 * system is used to describe the coordinate. If no CRS is defined, it will default to the given
 * fromProjection, and if nothing is found in both places it will default to WGS84.
 *
 * @param geometry Geometry to be reprojected
 * @param toProjection Wanted projection for these data
 * @param fromProjection Source projection, in which the data is being described (or `undefined` if
 *   none were set in the GeoJSON data, meaning it is described with WGS84)
 */
export function reprojectGeoJsonGeometry(
  geometry: Geometry,
  toProjection: CoordinateSystem,
  fromProjection?: CoordinateSystem,
): Geometry {
  const matchingProjection: CoordinateSystem =
    // GeoJSONs don't give CRS anymore, since some later revision (see https://datatracker.ietf.org/doc/html/rfc7946#appendix-B.1)
    fromProjection ??
    // if nothing is found in the GeoJSON or the param value, we default to WGS84
    // according to the IETF reference, if nothing is said about the projection used, it should be WGS84
    WGS84;

  if (matchingProjection.epsg !== toProjection.epsg) {
    log.debug("Reprojecting JSON geometry", geometry);
    return reproject(geometry, matchingProjection.epsg, toProjection.epsg);
  }
  // it's already in the correct projection, we don't re-project
  return geometry;
}

/**
 * Transforms some GeoJSON feature/data into the TurfJS equivalent. This might be useful when we
 * want to compute distance or similar things with turf, but we do not know what kind of GeoJSON
 * geometry type we are dealing with.
 *
 * @param geometry
 * @param fromProjection In which coordinate-system is this GeoJSON data described as. If nothing is
 *   specified, the default projection of GeoJSON data must be WGS84. Default is `undefined`
 */
export function transformIntoTurfEquivalent(
  geometry: Geometry,
  fromProjection?: CoordinateSystem,
): Feature | undefined {
  const geometryWGS84 = reprojectGeoJsonGeometry(
    geometry.type === "GeometryCollection" ? geometry.geometries[0] : geometry,
    WGS84,
    fromProjection,
  );

  switch (geometryWGS84.type) {
    case "Point":
      return point(geometryWGS84.coordinates);
    case "MultiPoint":
      return multiPoint(geometryWGS84.coordinates);
    case "LineString":
      return lineString(geometryWGS84.coordinates);
    case "MultiLineString":
      return multiLineString(geometryWGS84.coordinates);
    case "Polygon":
      return polygon(geometryWGS84.coordinates);
    case "MultiPolygon":
      return multiPolygon(geometryWGS84.coordinates);
  }
  log.error("Unknown geometry type", geometryWGS84.type);
  return;
}

/**
 * @param geometries An array of all geometries in features.
 * @returns An extent which covers all geometries given as parameter
 */
export function getExtentOfGeometries(
  geometries: Geometry[],
): NormalizedExtent | undefined {
  const featureCollectionFromGeometries: Feature[] = geometries
    .map((geometry) => transformIntoTurfEquivalent(geometry))
    .filter((feature) => feature !== undefined);
  const geometriesExtent = bbox(
    featureCollection(featureCollectionFromGeometries),
  );
  if (geometriesExtent.length === 4) {
    return extentUtils.normalizeExtent(geometriesExtent);
  }
  return undefined;
}
