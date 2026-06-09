import type { ComputedRef, Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { Distribution } from "@/types";

import { useConditionalFetch } from "./useConditionalFetch";

export function useGeoJson(distribution: Ref<Distribution>): {
  geoJsonData: ComputedRef<{
    geoJsonData: any;
    geoJsonStyle: any;
  }>;
} {
  const dataUrl = computed(() => extractGeoJsonDataUrl(distribution.value));
  const styleUrl = computed(() => extractGeoJsonStyleUrl(distribution.value));

  const { data: geoJsonData } = useConditionalFetch<string>(dataUrl);
  const { data: geoJsonStyle } = useConditionalFetch<string>(styleUrl);

  const data = computed(() => ({
    geoJsonData: JSON.parse(geoJsonData.value || "{}"),
    geoJsonStyle: JSON.parse(geoJsonStyle.value || "{}"),
  }));

  watchEffect(() => {
    log.debug({
      title: "useGeoJson",
      titleColor: LogPreDefinedColor.Indigo,
      messages: ["Loaded geoJsonData", data.value.geoJsonData],
    });
  });

  watchEffect(() => {
    log.debug({
      title: "useGeoJson",
      titleColor: LogPreDefinedColor.Indigo,
      messages: ["Loaded geoJsonStyle", data.value.geoJsonStyle],
    });
  });

  return {
    geoJsonData: data,
  };
}

function extractGeoJsonDataUrl(
  distribution: Distribution | null,
): string | null {
  if (!distribution || !distribution.links) {
    return null;
  }

  const datasetLinks = distribution.links.filter((link) => link.rel === "data");

  if (datasetLinks.length && datasetLinks[0]) {
    return datasetLinks[0].href;
  }

  // TODO warn
  return null;
}

function extractGeoJsonStyleUrl(
  distribution: Distribution | null,
): string | null {
  if (!distribution || !distribution.links) {
    return null;
  }

  const datasetLinks = distribution.links.filter(
    (link) => link.rel === "styledby",
  );

  if (datasetLinks.length && datasetLinks[0]) {
    return datasetLinks[0].href;
  }

  // TODO warn
  return null;
}
