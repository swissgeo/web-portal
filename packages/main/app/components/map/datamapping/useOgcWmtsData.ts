import type { Distribution, Service } from "@swissgeo/ogc";

import { useStyle, useWmtsCapabilities } from "@swissgeo/ogc";

import { defaultOpacityFromStyle } from "./defaultFromOpacity";

export function useOgcWmtsData(
  distribution: Ref<Distribution | null>,
  service: Ref<Service | null>,
  layerId: Ref<string | null>,
) {
  const { styleData } = useStyle(distribution);
  const { wmtsData } = useWmtsCapabilities(service, layerId);

  const options = computed(() => wmtsData.value?.options || null);
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
