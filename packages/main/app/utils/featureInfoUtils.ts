import type { LayerSource } from "@swissgeo/feature";

import { sourceToLayerRequest } from "@swissgeo/feature";

export function getUrlTemplate(layerSource: LayerSource) {
  return sourceToLayerRequest(layerSource)?.urlTemplate;
}
