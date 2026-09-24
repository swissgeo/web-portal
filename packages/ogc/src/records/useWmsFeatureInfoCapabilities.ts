import type { ComputedRef, Ref } from "vue";

import log from "@swissgeo/log";
import { computed } from "vue";

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
  layerId: string | null,
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
      `[WMS FeatureInfo capabilities] Unable to load capabilities for layer "${layerId}" — click feature info stays disabled. The reason is the following : ${error.toString()}`,
    );
  });
  const wmsFeatureInfo = computed(() => {
    if (!wmsCapabilityData.value || !layerId) {
      return null;
    }

    const doc = new DOMParser().parseFromString(
      wmsCapabilityData.value,
      "text/xml",
    );
    const layer = getLayer(doc, layerId);
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
