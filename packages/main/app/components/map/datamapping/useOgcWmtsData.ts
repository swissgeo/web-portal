import type { Distribution, Service } from "@swissgeo/ogc";

import { buildWmtsOptions } from "@swissgeo/map";
import { useStyle, useWmtsCapabilities } from "@swissgeo/ogc";
import { computedAsync } from "@vueuse/core";

import { defaultOpacityFromStyle } from "./defaultFromOpacity";

export function useOgcWmtsData(
  distribution: Ref<Distribution | null>,
  service: Ref<Service | null>,
  layerId: Ref<string | null>,
  onError: (error: unknown) => void = () => {},
) {
  const { styleData } = useStyle(distribution);
  const { capabilityUrl, wmtsData } = useWmtsCapabilities(
    service,
    layerId,
    (error) =>
      onError(
        new Error("Unable to load required WMTS capabilities", {
          cause: error,
        }),
      ),
  );

  // The OpenLayers WMTS options are now assembled in `map` from the parsed
  // ogc-client endpoint (async), instead of being produced OL-side in `ogc`.
  const options = computedAsync(async (onCancel) => {
    const endpoint = wmtsData.value?.endpoint;
    const currentLayerId = layerId.value;
    if (!endpoint || !currentLayerId) {
      return null;
    }

    let cancelled = false;
    onCancel(() => {
      cancelled = true;
    });

    try {
      const result = await buildWmtsOptions(endpoint, currentLayerId);
      if (!result) {
        throw new Error("WMTS capabilities contain no usable layer options");
      }
      return result;
    } catch (error) {
      if (!cancelled) {
        onError(
          new Error("Unable to build required WMTS layer options", {
            cause: error,
          }),
        );
      }
      return null;
    }
  }, null);

  // The service can become available after setup, so validate its URL reactively.
  watchEffect(() => {
    if (service.value && layerId.value && !capabilityUrl.value) {
      onError(new Error("Required WMTS capabilities URL is missing"));
    }
  });

  const dimensions = computed(() => {
    return wmtsData.value?.dimensions || null;
  });
  const legends = computed(() => wmtsData.value?.legends ?? []);

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
    legends,
  };
}
