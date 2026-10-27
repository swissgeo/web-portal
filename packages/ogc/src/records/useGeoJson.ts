import type { MapLibreStyleDocument } from "@swissgeo/shared";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { isMapLibreStyleDocument } from "@swissgeo/shared";
import { computed, watchEffect } from "vue";

import type { Distribution } from "@/types";

import { useConditionalFetch } from "./useConditionalFetch";
import { getLinksByRel } from "./utils";

/**
 * Minimal interface for the styledBy payload. the map package is responsible for
 * consuming it, so  the detailed fields needed are within the map package.
 */
export interface GeoJsonStylePayload {
  style: MapLibreStyleDocument;
  icons: unknown[];
}

export function useGeoJson(distribution: Ref<Distribution | null>) {
  const dataUrl = computed(() => extractGeoJsonDataUrl(distribution.value));
  const styleUrl = computed(() => extractGeoJsonStyleUrl(distribution.value));

  const { data: geoJsonData, error: dataError } = useConditionalFetch<Record<
    string,
    unknown
  > | null>(dataUrl, ["get", "json"]);
  const { data: stylePayload, error: styleError } =
    useConditionalFetch<GeoJsonStylePayload | null>(styleUrl, ["get", "json"]);

  const mapLibreStyle = computed(() => {
    const style = stylePayload.value?.style;
    return isMapLibreStyleDocument(style) ? style : null;
  });
  const mapLibreIcons = computed(() => stylePayload.value?.icons ?? []);

  /**
   * A GeoJSON distribution without a usable hosted style or data link cannot
   * be rendered as designed: a missing `styledBy`/data link, a failed fetch
   * or a malformed payload all surface here so the caller can fail the layer.
   * `null` while the distribution itself is still loading.
   */
  const error = computed<Error | null>(() => {
    if (!distribution.value) {
      return null;
    }
    if (!styleUrl.value) {
      return new Error("GeoJSON distribution has no styledBy link");
    }
    if (!dataUrl.value) {
      return new Error("GeoJSON distribution has no data link");
    }
    const styleFetchError = abortAwareError(styleError.value);
    if (styleFetchError) {
      return new Error("Unable to load GeoJSON style", {
        cause: styleFetchError,
      });
    }
    if (stylePayload.value && !mapLibreStyle.value) {
      return new Error(
        "GeoJSON style payload is malformed (expected a MapLibre v8 style document)",
      );
    }
    const dataFetchError = abortAwareError(dataError.value);
    if (dataFetchError) {
      return new Error("Unable to load GeoJSON data", {
        cause: dataFetchError,
      });
    }
    return null;
  });

  watchEffect(() => {
    log.debug({
      title: "useGeoJson",
      titleColor: LogPreDefinedColor.Indigo,
      messages: ["Loaded GeoJSON style payload", stylePayload.value],
    });
  });

  return {
    geoJsonData,
    mapLibreStyle,
    mapLibreIcons,
    error,
  };
}

function abortAwareError(error: unknown): unknown {
  if (error instanceof Error && error.name === "AbortError") {
    return null;
  }
  if (typeof error === "string" && error.includes("AbortError")) {
    return null;
  }
  return error ?? null;
}

function extractGeoJsonDataUrl(
  distribution: Distribution | null,
): string | null {
  if (!distribution || !distribution.links) {
    return null;
  }

  const dataLink = getLinksByRel(distribution.links, "data")[0];
  if (dataLink?.href) {
    return dataLink.href;
  }

  // Currently, the data is found in the `about` link. we use this as a fallback
  // until we know if the geoJson data will always be in about (then we remove the
  // previous line), or should be in data (and we remove the next line)
  const aboutLink = getLinksByRel(distribution.links, "about").find(
    (link) => link.type?.toLowerCase() === "application/geo+json",
  );
  return aboutLink?.href ?? null;
}

function extractGeoJsonStyleUrl(
  distribution: Distribution | null,
): string | null {
  if (!distribution || !distribution.links) {
    return null;
  }

  const datasetLinks = getLinksByRel(distribution.links, "styledby");

  if (datasetLinks.length && datasetLinks[0]) {
    return datasetLinks[0].href;
  }

  // TODO warn
  return null;
}
