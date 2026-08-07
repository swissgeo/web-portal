import type { Ref } from "vue";

import { WmtsEndpoint } from "@camptocamp/ogc-client";
import { registerProj4 } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computedAsync } from "@vueuse/core";
import proj4 from "proj4";
import { computed, watchEffect } from "vue";

import type { Service } from "@/types/Records";

import { useCapabilities } from "./useCapabilities";

// ogc-client resolves coordinate systems via proj4; make sure the custom Swiss
// projections are registered. This is a proj4 concern (not OpenLayers), so it
// stays here. The OpenLayers-side `register(proj4)` now lives in `map`.
registerProj4(proj4);

export function useWmtsCapabilities(
  serviceData: Ref<Service | null>,
  layerId: Ref<string | null>,
) {
  const { capabilityUrl } = useCapabilities(serviceData);

  // Keyed only on `capabilityUrl` so switching layers on the same service
  // reuses the already-fetched/parsed endpoint instead of re-fetching it.
  const endpoint = computedAsync(
    () =>
      capabilityUrl.value
        ? new WmtsEndpoint(capabilityUrl.value).isReady()
        : null,
    null,
  );

  const wmtsData = computed(() => {
    if (!endpoint.value || !layerId.value) {
      return null;
    }
    const layer = endpoint.value.getLayerByName(layerId.value);
    return {
      // The parsed endpoint is passed to `map`, which builds the OpenLayers
      // WMTS source options from it (see `buildWmtsOptions`). This keeps
      // OpenLayers out of `@swissgeo/ogc`.
      endpoint: endpoint.value,
      dimensions: layer?.dimensions ?? null,
    };
  });

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
