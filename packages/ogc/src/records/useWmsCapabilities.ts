import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { WMSCapabilityDimension } from "@/types/Capabilities";
import type { Service } from "@/types/Records";

import { useCapabilities } from "./useCapabilities";
import { useConditionalFetch } from "./useConditionalFetch";

const XLINK_NS = "http://www.w3.org/1999/xlink";

export interface WmsCapabilitiesData {
  /** Service `OnlineResource` (GetMap base URL). */
  url: string | null;
  /** Advertised WMS version, e.g. `1.3.0`. */
  version: string | null;
  /** Time (and other) dimensions of the requested layer, if any. */
  dimensions: WMSCapabilityDimension[] | null;
}

export function useWmsCapabilities(
  serviceData: Ref<Service | null>,
  layerId: Ref<string | null>,
) {
  const { capabilityUrl } = useCapabilities(serviceData);

  const { data: wmsCapabilityData } =
    useConditionalFetch<string>(capabilityUrl);

  const wmsData = computed(() =>
    parseWmsCapabilities(wmsCapabilityData.value, layerId.value),
  );

  watchEffect(() => {
    log.debug({
      title: "useCapabilities",
      titleColor: LogPreDefinedColor.Yellow,
      messages: ["wms capability data is", wmsData.value],
    });
  });
  return {
    wmsData,
  };
}

/**
 * Parses the relevant bits of a WMS GetCapabilities document without depending
 * on OpenLayers. ogc-client (1.3.0) does not expose WMS layer dimensions, so we
 * read the service URL, version and the requested layer's dimensions directly
 * from the XML. This is intentionally a small, local parser (see GPS-804); it
 * can later be replaced by upstream ogc-client support.
 */
export function parseWmsCapabilities(
  capabilityData: string | null,
  layerId: string | null,
): WmsCapabilitiesData {
  if (!capabilityData || !layerId) {
    return {
      url: null,
      version: null,
      dimensions: null,
    };
  }

  const doc = new DOMParser().parseFromString(capabilityData, "text/xml");

  return {
    version: doc.documentElement?.getAttribute("version") ?? null,
    url: getServiceUrl(doc),
    dimensions: getDimensions(doc, layerId),
  };
}

function getServiceUrl(doc: Document): string | null {
  const service = doc.getElementsByTagName("Service")[0];
  if (!service) {
    return null;
  }
  const onlineResource = firstDirectChild(service, "OnlineResource");
  if (!onlineResource) {
    return null;
  }
  return (
    onlineResource.getAttribute("xlink:href") ??
    onlineResource.getAttributeNS(XLINK_NS, "href")
  );
}

export function getDimensions(
  doc: Document,
  layerId: string,
): WMSCapabilityDimension[] | null {
  const layer = Array.from(doc.getElementsByTagName("Layer")).find(
    (candidate) =>
      firstDirectChild(candidate, "Name")?.textContent?.trim() === layerId,
  );
  if (!layer) {
    return null;
  }

  const dimensions = directChildren(layer, "Dimension").map(parseDimension);
  return dimensions.length ? dimensions : null;
}

function parseDimension(element: Element): WMSCapabilityDimension {
  const multipleValues = element.getAttribute("multipleValues");
  return {
    name: element.getAttribute("name") ?? "",
    units: element.getAttribute("units") ?? "",
    unitSymbol: element.getAttribute("unitSymbol") ?? undefined,
    default: element.getAttribute("default") ?? undefined,
    multipleValues:
      multipleValues === null
        ? undefined
        : multipleValues === "1" || multipleValues === "true",
    values: element.textContent?.trim() || undefined,
  };
}

function directChildren(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter(
    (child) => child.localName === localName,
  );
}

function firstDirectChild(
  parent: Element,
  localName: string,
): Element | undefined {
  return directChildren(parent, localName)[0];
}
