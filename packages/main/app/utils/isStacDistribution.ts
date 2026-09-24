import type { Distribution } from "@swissgeo/ogc";

export function isStacDistribution(
  distribution: Pick<Distribution, "properties">,
) {
  return distribution.properties.protocol?.toLowerCase() === "ogcapi:stac";
}
