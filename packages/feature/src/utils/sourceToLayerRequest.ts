import type {
  LayerRequest,
  LayerSource,
  WMSLayerRequest,
  WmsFeatureInfoCapability,
} from "@/types";

import { isGeoAdminSource } from "@/types";

export function sourcesToLayerRequests(
  layerSources: LayerSource[],
  wmsCapabilities?: Record<string, WmsFeatureInfoCapability>,
): Array<LayerRequest | WMSLayerRequest> {
  return layerSources.map((layerSource: LayerSource) =>
    sourceToLayerRequest(layerSource, wmsCapabilities),
  );
}

export function sourceToLayerRequest(
  layerSource: LayerSource,
  wmsCapabilities?: Record<string, WmsFeatureInfoCapability>,
): LayerRequest | WMSLayerRequest {
  // priority 1: geojson / KML / KMZ layers most likely will have features as
  // part of the source data.
  if (
    isGeoAdminSource(layerSource) &&
    layerSource.preResolvedFeatures?.length > 0
  ) {
    return {
      layerUuid: layerSource.layerUuid,
      layerId: layerSource.layerId,
      preResolvedFeatures: layerSource.preResolvedFeatures,
    };
  }

  // priority 2: identify is present
  if (isGeoAdminSource(layerSource) && layerSource.distribution) {
    const dist = layerSource.distribution?.features.filter(
      (ogcFeature) =>
        ogcFeature.properties.protocol.toLowerCase() === "geoadmin:features",
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

  // priority 3: WMS GetFeatureInfo: Using the stored capabilities
  const capability: WmsFeatureInfoCapability | undefined =
    wmsCapabilities?.[layerSource.layerUuid];
  if (capability?.getFeatureInfoCapability && capability.availableCrs) {
    return {
      layerUuid: layerSource.layerUuid,
      layerId: layerSource.layerId,
      wmsGetFeatureInfo: capability.getFeatureInfoCapability,
      wmsVersion: capability.wmsVersion ?? "1.3.0",
      availableCrs: capability.availableCrs,
    };
  }

  // unsupported cases end up with an "empty" layerRequest
  return { layerUuid: layerSource.layerUuid, layerId: layerSource.layerId };
}
