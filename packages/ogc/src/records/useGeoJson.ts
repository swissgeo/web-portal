import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { Distribution } from "@/types";

import { useConditionalFetch } from "./useConditionalFetch";

export function useGeoJson(distribution: Ref<Distribution | null>) {
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

  // The GeoJSON data file is the link advertising the geo+json media type
  // (catalog uses rel="about" for it).
  const dataLinks = distribution.links.filter(
    (link) => link.type === "application/geo+json",
  );

  if (dataLinks.length && dataLinks[0]) {
    return dataLinks[0].href;
  }

  log.warn({
    title: "useGeoJson",
    titleColor: LogPreDefinedColor.Amber,
    messages: [
      "Unable to find a GeoJSON data link (type=application/geo+json) in distribution",
      distribution,
    ],
  });
  return null;
}

function extractGeoJsonStyleUrl(
  distribution: Distribution | null,
): string | null {
  if (!distribution || !distribution.links) {
    return null;
  }

  const styleLinks = distribution.links.filter(
    (link) => link.rel === "styled-by",
  );

  if (styleLinks.length && styleLinks[0]) {
    return styleLinks[0].href;
  }

  log.warn({
    title: "useGeoJson",
    titleColor: LogPreDefinedColor.Amber,
    messages: [
      'Unable to find a GeoJSON style link (rel="styled-by") in distribution',
      distribution,
    ],
  });
  return null;
}
