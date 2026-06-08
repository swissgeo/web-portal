import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, toValue, watchEffect } from "vue";

import type { Distribution, Link, Service } from "@/types/Records";

import { useConditionalFetch } from "./useConditionalFetch";
import { getLinksByRel } from "./utils";

export function useService(distribution: Ref<Distribution | null>) {
  const serviceUrl = computed(() => extractServiceUrl(distribution.value));

  const {
    data: serviceData,
    /*
        isFetching,
        error,
        */
  } = useConditionalFetch<Service>(serviceUrl, ["get", "json"]);

  watchEffect(() => {
    log.debug({
      title: "useService ",
      titleColor: LogPreDefinedColor.Emerald,
      messages: ["Received new distribution data", toValue(distribution)],
    });
  });

  watchEffect(() => {
    log.debug({
      title: "useService",
      titleColor: LogPreDefinedColor.Emerald,
      messages: ["Service URL is", toValue(serviceUrl)],
    });
  });

  watchEffect(() => {
    log.debug({
      title: "useService",
      titleColor: LogPreDefinedColor.Emerald,
      messages: ["Service data fetched", toValue(serviceData)],
    });
  });

  return {
    serviceUrl,
    serviceData,
    /*
        isFetching,
        error,
        */
  };
}

/**
 * Extract the URL to the service (rel)
 * @param distribution
 * @returns
 */
export function extractServiceUrl(
  distribution: Pick<Distribution, "links"> | null,
): string | null {
  if (!distribution) {
    return null;
  }
  const links = distribution.links;

  if (!links) {
    log.error({
      title: "useService",
      titleColor: LogPreDefinedColor.Yellow,
      messages: [
        "Unable to extract service url from distribution",
        distribution,
      ],
    });
    throw new Error("Unable to extract service URL");
  }

  const link = getDataServiceLinks(links)[0];
  if (!link) {
    return null;
    // throw new Error("Unable to find link for rel type 'service'")
  }
  const href = link.href;

  if (!href) {
    throw new Error(
      `Faulty wmts record, neither href nor uriTemplate found: ${JSON.stringify(link)}`,
    );
  }
  return href;
}

export const getDataServiceLinks = (links: Link[]): Link[] => {
  return getLinksByRel(links, "dataservice");
};
