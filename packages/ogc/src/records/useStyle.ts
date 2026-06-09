import type { Style, StyleSpecification } from "mapbox-gl";
import type { ComputedRef, Ref, ShallowRef } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { Distribution, Link } from "@/types/Records";

import { useConditionalFetch } from "./useConditionalFetch";

export function useStyle(distribution: Ref<Distribution | null>): {
  styleDataUrl: ComputedRef<string>;
  styleData: ShallowRef<StyleSpecification>;
  isFetching: Readonly<ShallowRef<boolean>>;
  error: ShallowRef<any>;
} {
  const styleDataUrl = computed(() => extractStyleUrl(distribution.value));

  const {
    data: styleData,
    isFetching,
    error,
  } = useConditionalFetch<Style>(styleDataUrl, ["get", "json"]);

  watchEffect(() => {
    log.debug({
      title: "useStyle",
      titleColor: LogPreDefinedColor.Pink,
      messages: ["Style URL is now", styleDataUrl.value],
    });
  });

  watchEffect(() => {
    log.debug({
      title: "useStyle",
      titleColor: LogPreDefinedColor.Pink,
      messages: ["Received new style data", styleData.value],
    });
  });

  return {
    styleDataUrl,
    styleData,
    isFetching,
    error,
  };
}

export function extractStyleUrl(
  distribution: Distribution | null,
): string | null {
  if (!distribution) {
    return null;
  }

  const links = distribution.links;

  if (!links) {
    log.error({
      title: "useStyle",
      titleColor: LogPreDefinedColor.Pink,
      messages: ["Unable to find links in distribution", distribution],
    });
    return null;
  }

  const link = getStyleLinks(links)[0];
  if (!link) {
    return null;
  }

  const href = link.href;

  if (!href) {
    throw new Error(`Faulty styledby record`);
  }
  return href;
}

function getStyleLinks(links: Link[]) {
  return links.filter((link) => link.rel.toLowerCase() === "styledby");
}
