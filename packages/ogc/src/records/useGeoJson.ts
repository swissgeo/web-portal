import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { Distribution } from "@/types";

import { useConditionalFetch } from "./useConditionalFetch";
import { getLinksByRel } from "./utils";

export function useGeoJson(distribution: Ref<Distribution | null>) {
  const dataUrl = computed(() => extractGeoJsonDataUrl(distribution.value));
  const styleUrl = computed(() => extractGeoJsonStyleUrl(distribution.value));

  const { data: rawData } = useConditionalFetch<string>(dataUrl);
  const { data: rawStyle } = useConditionalFetch<string>(styleUrl);

  // Parsed separately so the (potentially multi-MB) feature collection is not
  // re-parsed when only the style arrives, and vice-versa.
  const parsedData = computed(() => JSON.parse(rawData.value || "{}"));
  const parsedStyle = computed(() => JSON.parse(rawStyle.value || "{}"));

  const data = computed(() => ({
    geoJsonData: parsedData.value,
    geoJsonStyle: parsedStyle.value,
  }));

  watchEffect(() => {
    log.debug({
      title: "useGeoJson",
      titleColor: LogPreDefinedColor.Indigo,
      messages: [
        "Loaded GeoJSON",
        `${parsedData.value?.features?.length ?? 0} feature(s)`,
        "style",
        parsedStyle.value,
      ],
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
  const dataLink = distribution.links.find(
    (link) => link.type === "application/geo+json",
  );

  if (dataLink) {
    return dataLink.href;
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

  const styleLink = getLinksByRel(distribution.links, "styled-by")[0];

  if (styleLink) {
    return styleLink.href;
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
