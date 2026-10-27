import type { Distribution } from "@swissgeo/ogc";

export function determineFormat(
  distribution: Pick<Distribution, "properties"> | null,
): "WMS" | "WMTS" | "STAC" | "GeoJSON" | null {
  if (!distribution?.properties) {
    return null;
  }

  const protocol = distribution.properties.protocol;

  switch (protocol?.toLowerCase()) {
    case "ogc:wmts":
      return "WMTS";
    case "ogc:wms":
      return "WMS";
    case "ogcapi:stac":
      return "STAC";
    // this is what is currently found within the api, we'll need to check if this
    // is what it's supposed to be.
    case "geojson":
      return "GeoJSON";
    default:
      return null;
  }
}
