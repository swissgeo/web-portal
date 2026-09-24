import type {
  LayerRequest,
  LayerSource,
  WMSLayerRequest,
  WmsFeatureInfoCapability,
} from "@/types";

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
  if (layerSource.preResolvedFeatures?.length > 0) {
    return {
      layerUuid: layerSource.layerUuid,
      layerId: layerSource.layerId,
      preResolvedFeatures: layerSource.preResolvedFeatures,
      layerName: layerSource.layerName ?? layerSource.layerId,
    };
  }
  // priority 2: try to see if there is an identify available
  if (
    layerSource.getFeatureInfoInformation?.baseUrl &&
    (layerSource.getFeatureInfoInformation?.protocol === "geoadmin:features" ||
      layerSource.getFeatureInfoInformation?.protocol === "ogc:api3features")
  ) {
    return {
      layerUuid: layerSource.layerUuid,
      layerId: layerSource.layerId,
      baseUrl: layerSource.getFeatureInfoInformation.baseUrl,
      urlTemplate: `${layerSource.getFeatureInfoInformation.baseUrl}/${layerSource.layerId}/{featureId}/htmlPopup?lang={lang}`,
      layerName: layerSource.layerName ?? layerSource.layerId,
    };
  }

  // priority 3: WMS GetFeatureInfo: Using the stored capabilities
  const capability: WmsFeatureInfoCapability | undefined =
    wmsCapabilities?.[layerSource.layerUuid];
  if (capability) {
    return {
      layerUuid: layerSource.layerUuid,
      layerId: layerSource.layerId,
      wmsGetFeatureInfo: capability.getFeatureInfoCapability,
      wmsVersion: capability.wmsVersion ?? "1.3.0",
      availableCrs: capability.availableCrs,
      layerName: capability.layerName,
    };
  }

  // unsupported cases end up with an "empty" layerRequest
  return {
    layerUuid: layerSource.layerUuid,
    layerId: layerSource.layerId,
    layerName: layerSource.layerName ?? layerSource.layerId,
  };
}
