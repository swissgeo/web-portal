import type { Distribution, Service } from "@swissgeo/ogc";

import { buildWmtsOptions } from "@swissgeo/map";
import { useStyle, useWmtsCapabilities } from "@swissgeo/ogc";
import { computedAsync } from "@vueuse/core";

import { defaultOpacityFromStyle } from "./defaultFromOpacity";

export function useOgcWmtsData(
  distribution: Ref<Distribution | null>,
  service: Ref<Service | null>,
  layerId: Ref<string | null>,
) {
  const { styleData } = useStyle(distribution);
  const { wmtsData } = useWmtsCapabilities(service, layerId);

  // The OpenLayers WMTS options are now assembled in `map` from the parsed
  // ogc-client endpoint (async), instead of being produced OL-side in `ogc`.
  const options = computedAsync(async () => {
    const endpoint = wmtsData.value?.endpoint;
    if (!endpoint || !layerId.value) {
      return null;
    }
    return buildWmtsOptions(endpoint, layerId.value);
  }, null);

  const dimensions = computed(() => {
    return wmtsData.value?.dimensions || null;
  });

  const timeInfo = computed(() => {
    return getTimeInfoFromWMTSCapabilities(dimensions.value);
  });

  const defaultOpacity = computed(() => {
    if (styleData.value) {
      return defaultOpacityFromStyle(styleData.value);
    } else {
      return null;
    }
  });

  return {
    options,
    timeInfo,
    defaultOpacity,
  };
}
