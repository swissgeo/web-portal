import type { Ref } from "vue";

import { enableFallbackWithoutWorker, WmtsEndpoint } from "@camptocamp/ogc-client";
import { registerProj4 } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computedAsync } from "@vueuse/core";
import proj4 from "proj4";
import { watchEffect } from "vue";

import type { Service } from "@/types/Records";

import { useCapabilities } from "./useCapabilities";

// ogc-client parses capabilities in a Web Worker by default. Disable it so that
// parsing also works in SSR and test environments (and so request mocking such
// as msw can intercept the capabilities fetch on the main thread).
enableFallbackWithoutWorker();

// ogc-client resolves coordinate systems via proj4; make sure the custom Swiss
// projections are registered. This is a proj4 concern (not OpenLayers), so it
// stays here. The OpenLayers-side `register(proj4)` now lives in `map`.
registerProj4(proj4);

export function useWmtsCapabilities(
  serviceData: Ref<Service | null>,
  layerId: Ref<string | null>,
) {
  const { capabilityUrl } = useCapabilities(serviceData);

  const wmtsData = computedAsync(
    () => parseWmtsCapabilities(capabilityUrl.value, layerId.value),
    null,
  );

  watchEffect(() => {
    log.debug({
      title: "useCapabilities",
      titleColor: LogPreDefinedColor.Yellow,
      messages: ["wmts capability data is", wmtsData.value],
    });
  });

  return {
    capabilityUrl,
    wmtsData,
  };
}

export async function parseWmtsCapabilities(
  capabilityUrl: string | null,
  layerId: string | null,
) {
  if (!capabilityUrl || !layerId) {
    return null;
  }

  const endpoint = await new WmtsEndpoint(capabilityUrl).isReady();
  const layer = endpoint.getLayerByName(layerId);

  return {
    // The parsed endpoint is passed to `map`, which builds the OpenLayers WMTS
    // source options from it (see `buildWmtsOptions`). This keeps OpenLayers out
    // of `@swissgeo/ogc`.
    endpoint,
    dimensions: layer?.dimensions ?? null,
  };
}
