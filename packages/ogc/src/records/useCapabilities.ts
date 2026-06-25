import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, toValue, watchEffect } from "vue";

import type { Service } from "@/types/Records";

import { replaceTemplateVarsWithDefaults } from "./utils";

export function useCapabilities(serviceData: Ref<Service | null>) {
  const capabilityUrl = computed(() => extractCapabilityUrl(serviceData.value));

  watchEffect(() => {
    log.debug({
      title: "useCapabilities",
      titleColor: LogPreDefinedColor.Yellow,
      messages: ["Capability URL is now", toValue(capabilityUrl)],
    });
  });

  return {
    capabilityUrl,
  };
}

export function extractCapabilityUrl(
  serviceData: Pick<Service, "links" | "linkTemplates"> | null,
): string | null {
  if (!serviceData) {
    return null;
  }

  if ("links" in serviceData && serviceData.links && serviceData.links.length) {
    for (const link of serviceData.links) {
      if (link.rel.toLowerCase() === "about") {
        const uri = link.href ?? null;
        return uri;
      }
    }
  }
  if (
    "linkTemplates" in serviceData &&
    serviceData.linkTemplates &&
    serviceData.linkTemplates.length
  ) {
    // if there are links and linkTemplates, we want links to take precedence
    // it's the simpler version
    for (const link of serviceData.linkTemplates) {
      if (link.rel.toLowerCase() === "about") {
        return replaceTemplateVarsWithDefaults(link);
      }
    }
  }

  return null;
}
