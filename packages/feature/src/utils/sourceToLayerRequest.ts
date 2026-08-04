import type { Feature as geojsonFeature } from "geojson";

import type { LayerRequest, LayerSource, OgcDistribution } from "@/types";

export function sourcesToLayerRequests(layerSources: LayerSource[]) {
  return layerSources.map((layerSource: LayerSource) =>
    sourceToLayerRequest(
      layerSource.layerUuid,
      layerSource.distribution,
      layerSource.preResolvedFeatures,
    ),
  );
}

export function sourceToLayerRequest(
  layerUuid: string,
  distribution?: OgcDistribution,
  preResolvedFeatures?: geojsonFeature[],
): LayerRequest {
  // First case: geojson / KML / KMZ layers most likely will have features as part of the source data.
  if (preResolvedFeatures && preResolvedFeatures.length > 0) {
    return {
      layerUuid,
      layerId: distribution?.id ?? "undefined",
      preResolvedFeatures,
    };
  }

  const dist = distribution?.features.filter(
    (ogcFeature) => ogcFeature.properties.protocol === "geoadmin:features",
  )[0];

  if (dist) {
    const template = dist.linkTemplates.find(
      (linkTemplate) => linkTemplate.rel === "preview",
    ).uriTemplate;

    return { layerUuid, layerId: distribution.id, urlTemplate: template };
  }
  // For now, we return an "empty" layer request. We'll need to check if there is a WMS getFeature endpoint (for example: external layers)
  return { layerUuid, layerId: distribution?.id ?? "undefined" };
}
