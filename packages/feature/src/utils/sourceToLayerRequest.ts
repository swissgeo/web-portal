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
      origin: layerSource.origin,
      preResolvedFeatures: layerSource.preResolvedFeatures,
      layerName: layerSource.layerName,
    };
  }
  // priority 2: try to see if there is an identify available
  if (isIdentifyFeatureInfo(layerSource.getFeatureInfoInformation)) {
    const { baseUrl, externalId, distributionId } =
      layerSource.getFeatureInfoInformation;
    return {
      layerUuid: layerSource.layerUuid,
      origin: layerSource.origin,
      baseUrl,
      externalId,
      distributionId,
      urlTemplate:
        externalId &&
        `${baseUrl}/${externalId}/{featureId}/htmlPopup?lang={lang}`,
      layerName: layerSource.layerName,
    };
  }

  // priority 3: WMS GetFeatureInfo: Using the stored capabilities
  const capability: WmsFeatureInfoCapability | undefined =
    wmsCapabilities?.[layerSource.layerUuid];
  if (capability) {
    return {
      layerUuid: layerSource.layerUuid,
      origin: layerSource.origin,
      externalId: layerSource.getFeatureInfoInformation?.externalId,
      distributionId: layerSource.getFeatureInfoInformation?.distributionId,
      wmsGetFeatureInfo: capability.getFeatureInfoCapability,
      wmsVersion: capability.wmsVersion ?? "1.3.0",
      availableCrs: capability.availableCrs,
      layerName: capability.layerName,
    };
  }

  // unsupported cases end up with an "empty" layerRequest
  return {
    layerUuid: layerSource.layerUuid,
    origin: layerSource.origin,
    layerName: layerSource.layerName,
  };
}

export function isIdentifyFeatureInfo(featureInfo?: {
  protocol?: string;
  baseUrl?: string;
}): boolean {
  return (
    featureInfo?.baseUrl &&
    (featureInfo.protocol === "geoadmin:features" ||
      featureInfo.protocol === "ogc:api3features")
  );
}
