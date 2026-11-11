import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";

import log from "@swissgeo/log";
import { computed, toValue } from "vue";

import { useConditionalFetch } from "./useConditionalFetch";
import { getLayer } from "./useWmsCapabilities";
import {
  getAvailableCrs,
  getFeatureInfoCapability,
  getLayerName,
  getRootLayer,
  isQueryable,
} from "./wmsCapabilitiesUtils";

export function useWmsFeatureInfoCapabilities(
  layerId: MaybeRefOrGetter<string | null>,
  capabilityUrl: Ref<string | null>,
): ComputedRef<{
  availableCrs: string[];
  getFeatureInfoCapability: {
    baseUrl: string;
    method: "GET" | "POST";
    formats: string[];
  };
  wmsVersion: string | null;
  layerName: string | null;
} | null> {
  const { data: wmsCapabilityData, onRequestError } =
    useConditionalFetch<string>(capabilityUrl);
  onRequestError((error) => {
    log.warn(
      `[WMS FeatureInfo capabilities] Unable to load capabilities for layer "${toValue(layerId)}" — click feature info stays disabled. The reason is the following : ${error.toString()}`,
    );
  });
  const wmsFeatureInfo = computed(() => {
    const id = toValue(layerId);
    if (!wmsCapabilityData.value || !id) {
      return null;
    }

    const doc = new DOMParser().parseFromString(
      wmsCapabilityData.value,
      "text/xml",
    );
    const layer = getLayer(doc, id);
    if (layer && !isQueryable(layer)) {
      return null;
    }
    const featureInfoCapability = getFeatureInfoCapability(doc);
    if (!featureInfoCapability) {
      return null;
    }
    return {
      availableCrs: getAvailableCrs(layer ?? getRootLayer(doc)),
      getFeatureInfoCapability: featureInfoCapability,
      wmsVersion: doc.documentElement?.getAttribute("version") ?? null,
      layerName: layer ? getLayerName(layer) : null,
    };
  });
  return wmsFeatureInfo;
}
