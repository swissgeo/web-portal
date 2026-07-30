import type { LayerFormat } from "@swissgeo/map";
import type { Distribution } from "@swissgeo/ogc";

export function determineFormat(
  distribution: Pick<Distribution, "properties"> | null,
): LayerFormat | null {
  if (!distribution?.properties) {
    return null;
  }

  const protocol = distribution.properties.protocol;

  // WMTS/WMS carry an "ogc:" prefix in the catalog; GeoJSON distributions use the
  // bare "geojson" protocol.
  switch (protocol?.toLowerCase()) {
    case "ogc:wmts":
      return "WMTS";
    case "ogc:wms":
      return "WMS";
    case "geojson":
      return "GeoJSON";
    default:
      return null;
  }
}
