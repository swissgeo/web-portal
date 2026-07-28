import type { FlatExtent, NormalizedExtent } from "@swissgeo/shared";

import log from "@swissgeo/log";

import type { FeatureData, LayerRequest } from "@/types";

import { FEATURE_LIMIT } from "@/constants";
import { useFeaturesStore } from "@/stores/feature";
import { NotImplemented } from "@/utils/errorHandling";

export async function identify(
  extent: FlatExtent | NormalizedExtent,
  epsgNumber: number,
  lang: string,
  layers: LayerRequest[],
  limit: number = FEATURE_LIMIT,
  abortSignal?: AbortSignal,
  onNotImplemented?: (strategyId: string) => void,
): Promise<void> {
  const results = await Promise.allSettled(
    layers.map((layerRequest) =>
      getFeaturesForOneLayer(layerRequest, extent, epsgNumber, lang, limit),
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
      if (err instanceof NotImplemented) {
        onNotImplemented?.(err.strategyId);
      }
      log.error(err);
    }
  }

  useFeaturesStore().setSelection(storePayload);
}

// only exported for testing purpose, we only use identify outside this file
// eslint-disable-next-line @typescript-eslint/require-await
export async function getFeaturesForOneLayer(
  layerRequest: LayerRequest,
  extent: FlatExtent | NormalizedExtent,
  epsgNumber: number,
  lang: string,
  limit: number,
): Promise<FeatureData[]> {
  if (layerRequest.preResolvedFeatures) {
    return layerRequest.preResolvedFeatures.slice(0, limit).map((feature) => ({
      featureId: String(feature.id ?? crypto.randomUUID()),
      geometry: feature.geometry,
      content: { kind: "json", properties: feature.properties ?? {} },
    }));
  } else if (layerRequest.urlTemplate) {
    throw new NotImplemented(
      `${layerRequest.strategy} within the url Template`,
    );
  }
  // there is no data to use, we return an empty array
  return [];
}
