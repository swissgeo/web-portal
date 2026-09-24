import type { Distribution } from "@swissgeo/ogc";

export function determineFormat(
  distribution: Pick<Distribution, "properties"> | null,
): "WMS" | "WMTS" | null {
  if (!distribution?.properties) {
    return null;
  }

  const protocol = distribution.properties.protocol;

  switch (protocol?.toLowerCase()) {
    case "ogc:wmts":
      return "WMTS";
    case "ogc:wms":
      return "WMS";
    default:
      return null;
  }
}
