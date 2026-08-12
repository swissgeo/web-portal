import type { Distribution, Service } from "@swissgeo/ogc";

import { useStyle, useWmsCapabilities } from "@swissgeo/ogc";

import { getTimeInfoFromWMSCapabilities } from "@/utils/timeUtils";

import { defaultOpacityFromStyle } from "./defaultFromOpacity";
import { defaultGutterFromStyle } from "./defaultGutterFromStyle";

export type WMSLayerData = {
  url: string | undefined;
  gutter: number;
  version: string | undefined;
  lang: string;
};

export function useOgcWmsData(
  distribution: Ref<Distribution | null>,
  service: Ref<Service | null>,
  layerId: Ref<string | null>,
  onError: (error: unknown) => void,
) {
  const { locale } = useI18n();

  const { styleData } = useStyle(distribution);
  const {
    capabilityUrl,
    onCapabilitiesError,
    onCapabilitiesResponse,
    wmsData,
  } = useWmsCapabilities(service, layerId);
  const dimensions = computed(() => wmsData.value?.dimensions || null);
  const timeInfo = computed(() =>
    getTimeInfoFromWMSCapabilities(dimensions.value),
  );

  const currentLang = computed(() => locale.value.toLowerCase());

  const url = computed(() => wmsData.value?.url ?? undefined);
  const version = computed(() => wmsData.value?.version ?? undefined);

  const defaultGutter = computed(() => {
    if (styleData.value) {
      return defaultGutterFromStyle(styleData.value);
    } else {
      return 0;
    }
  });

  const wmsDataForOl = computed(() => ({
    url: url.value,
    gutter: defaultGutter.value,
    version: version.value,
    lang: currentLang.value,
  }));

  const defaultOpacity = computed(() => {
    if (styleData.value) {
      return defaultOpacityFromStyle(styleData.value);
    } else {
      return null;
    }
  });

  // The service can become available after setup, so validate its URL reactively.
  watchEffect(() => {
    if (service.value && layerId.value && !capabilityUrl.value) {
      onError(new Error("Required WMS capabilities URL is missing"));
    }
  });
  onCapabilitiesError((error) =>
    onError(
      new Error("Unable to load required WMS capabilities", { cause: error }),
    ),
  );
  onCapabilitiesResponse(() => {
    if (
      !wmsData.value.layerFound ||
      !wmsData.value.url ||
      !wmsData.value.version
    ) {
      onError(new Error("WMS capabilities contain no usable layer data"));
    }
  });

  return {
    defaultOpacity,
    wmsDataForOl,
    timeInfo,
  };
}
