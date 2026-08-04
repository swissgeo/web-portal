import type { FlatExtent, NormalizedExtent } from "@swissgeo/shared";
import type { Geometry, GeometryCollection } from "geojson";

import log from "@swissgeo/log";

import type { FeatureData, LayerRequest, LayerSource } from "@/types";

import { FEATURE_LIMIT } from "@/constants";
import { useFeaturesStore } from "@/stores/feature";
import { sourcesToLayerRequests } from "@/utils/sourceToLayerRequest";

interface IdentifyResponse {
  results: Array<{
    id: string | number;
    geometry: Exclude<Geometry, GeometryCollection>;
  }>;
}

export async function selectFeatures(
  extent: FlatExtent | NormalizedExtent,
  epsgNumber: number,
  lang: string,
  layers: LayerSource[],
  limit: number = FEATURE_LIMIT,
  abortSignal?: AbortSignal,
): Promise<void> {
  const requests = sourcesToLayerRequests(layers);
  const results = await Promise.allSettled(
    requests.map((layerRequest) =>
      getFeaturesForOneLayer(
        layerRequest,
        extent,
        epsgNumber,
        lang,
        limit,
        abortSignal,
      ),
    ),
  );

  const storePayload: Record<string, FeatureData[]> = {};

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    const layer = layers[i]!;

    if (result.status === "fulfilled" && result.value.length > 0) {
      storePayload[layer.layerUuid] = result.value;
    } else if (result.status === "rejected") {
      const err = result.reason;
      log.error(err);
    }
  }

  useFeaturesStore().setSelection(storePayload);
}

// only exported for testing purpose, we only use identify outside this file
export async function getFeaturesForOneLayer(
  layerRequest: LayerRequest,
  extent: FlatExtent | NormalizedExtent,
  epsgNumber: number,
  lang: string,
  limit: number,
  abortSignal?: AbortSignal,
): Promise<FeatureData[]> {
  // features are already part of the request, we don't do anything more than format everything.
  if (layerRequest.preResolvedFeatures) {
    return layerRequest.preResolvedFeatures.slice(0, limit).map((feature) => ({
      featureId: String(feature.id ?? crypto.randomUUID()),
      geometry: feature.geometry as Exclude<Geometry, GeometryCollection>,
      content: { kind: "json", properties: feature.properties ?? {} },
    }));

    // this means we've an identify url, we use an Identify here
  } else if (layerRequest.urlTemplate) {
    const baseUrl = `${layerRequest.urlTemplate.split("MapServer")[0]}MapServer/`;
    const identifyUrl = `${baseUrl}identify?layers=all:${layerRequest.layerId}&sr=${epsgNumber}&geometry=${extent.join(",")}&geometryFormat=geojson&geometryType=esriGeometryEnvelope&limit=${limit}&tolerance=0&returnGeometry=true&lang=${lang}`;
    const identifyResult = await fetch(identifyUrl, { signal: abortSignal });
    if (identifyResult.status !== 200) {
      log.warn(
        `[Identify Request]: getting a ${identifyResult.status} code when running identify on the layer ${layerRequest.layerId}`,
      );
      return [];
    }

    const identifyFeatures =
      ((await identifyResult.json()) as IdentifyResponse).results ?? [];

    return Promise.allSettled(
      identifyFeatures.map(async (feature): Promise<FeatureData> => {
        const popupUrl = layerRequest
          .urlTemplate!.replace("{featureId}", String(feature.id))
          .replace("{lang}", lang);
        const response = await fetch(popupUrl, { signal: abortSignal });
        return {
          featureId: String(feature.id),
          geometry: feature.geometry,
          content: {
            kind: "html",
            html: await response.text(),
            trusted: true,
          },
        };
      }),
    ).then((results) =>
      results
        .filter(
          (result): result is PromiseFulfilledResult<FeatureData> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value),
    );
  }

  // there is no data to use, we return an empty array
  return [];
}
