import type { LayerSource, OgcDistribution } from "@swissgeo/feature";
import type { Layer as SourceLayer } from "@swissgeo/layers";

import { sourceToLayerRequest } from "@swissgeo/feature";
import { isDatasetLayer } from "@swissgeo/layers";

export async function getOgcDistribution(
  sourceLayer?: SourceLayer,
  signal?: AbortSignal,
) {
  if (sourceLayer && isDatasetLayer(sourceLayer)) {
    const url = (sourceLayer.data.links ?? []).find(
      (link) => link.rel?.toLowerCase() === "distributions",
    )?.href;
    try {
      if (url) {
        const result = signal ? await fetch(url, { signal }) : await fetch(url);
        return result.ok
          ? ((await result.json()) as OgcDistribution)
          : undefined;
      }
    } catch {
      return;
    }
  }
  return;
}

export function getUrlTemplate(layerSource: LayerSource) {
  return sourceToLayerRequest(layerSource)?.urlTemplate;
}
