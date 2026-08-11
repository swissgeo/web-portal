import type { LayerRequest, LayerSource } from "@/types";

export function sourcesToLayerRequests(layerSources: LayerSource[]) {
  return layerSources.map((layerSource: LayerSource) =>
    sourceToLayerRequest(layerSource),
  );
}

export function sourceToLayerRequest(layerSource: LayerSource): LayerRequest {
  // First case: geojson / KML / KMZ layers most likely will have features as part of the source data.
  if (
    layerSource.kind === "geoadmin" &&
    layerSource.preResolvedFeatures?.length > 0
  ) {
    return {
      layerUuid: layerSource.layerUuid,
      layerId: layerSource.layerId,
      preResolvedFeatures: layerSource.preResolvedFeatures,
    };
  }

  if (layerSource.kind === "geoadmin") {
    const dist = layerSource.distribution?.features.filter(
      (ogcFeature) => ogcFeature.properties.protocol === "geoadmin:features",
    )[0];
    if (dist) {
      const template = dist.linkTemplates?.find(
        (linkTemplate) => linkTemplate.rel === "preview",
      )?.uriTemplate;

      return {
        layerUuid: layerSource.layerUuid,
        layerId: layerSource.layerId,
        urlTemplate: template,
      };
    }
  }

  // For now, we return an "empty" layer request. We'll need to check if there is a WMS getFeature endpoint (for example: external layers)
  return { layerUuid: layerSource.layerUuid, layerId: layerSource.layerId };
}
