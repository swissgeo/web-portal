import type {
  LayerSource,
  OgcDistribution,
  OgcDistributionFeature,
} from "@swissgeo/feature";
import type { DatasetLayer, Layer as SourceLayer } from "@swissgeo/layers";

import { sourceToLayerRequest } from "@swissgeo/feature";
import { isDatasetLayer } from "@swissgeo/layers";
import log from "@swissgeo/log";

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

export async function getOgcFeatureInfo(
  sourceLayer?: SourceLayer,
  signal?: AbortSignal,
): Promise<OgcDistributionFeature | undefined> {
  const distribution = await getOgcDistribution(sourceLayer, signal);
  if (
    !distribution ||
    !distribution.features ||
    distribution.features.length < 1
  ) {
    log.warn(
      `[Feature Info from OGC record] no Distribution for layer ${sourceLayer?.humanId}`,
    );
    return;
  }
  // we get either the links from the preferred distribution, or the links from the first distribution if we don't have a preferred one
  const featureInfoLink = (
    distribution.features.find(
      (feature) =>
        feature.id ===
        (sourceLayer as DatasetLayer).data.properties?.preferredDistributionId,
    )?.links ?? distribution.features[0]?.links
  )?.filter((link) => link.rel.toLowerCase() === "featureinfo")[0];

  if (!featureInfoLink) {
    log.warn(
      `[Feature Info from OGC record] no Feature Info Link in the OGC record for layer ${sourceLayer?.humanId}`,
    );
    return;
  }
  const result = signal
    ? await fetch(featureInfoLink.href, { signal })
    : await fetch(featureInfoLink.href);

  if (!result.ok) {
    log.error(
      `[Feature Info from OGC record] Feature info link not reachable for ${sourceLayer?.humanId}. Status code: ${result.status}`,
    );
    return;
  }

  const featureInfoJson = (await result.json()) as OgcDistributionFeature;
  if (
    featureInfoJson.properties.protocol?.toLowerCase() ===
      "geoadmin:features" ||
    featureInfoJson.properties.protocol?.toLowerCase() === "ogc:wms"
  ) {
    return featureInfoJson;
  }

  return;
}

export function getUrlTemplate(layerSource: LayerSource) {
  return sourceToLayerRequest(layerSource)?.urlTemplate;
}
