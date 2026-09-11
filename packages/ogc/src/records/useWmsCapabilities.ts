import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, watchEffect } from "vue";

import type { Legend, WMSCapabilityDimension } from "@/types/Capabilities";
import type { Service } from "@/types/Records";

import { useCapabilities } from "./useCapabilities";
import { useConditionalFetch } from "./useConditionalFetch";

// XLink namespace URI, fixed by the W3C XLink spec and required by the WMS
// schema for `OnlineResource`. Only the prefix bound to it can vary between
// servers, so we read the attribute by namespace when the usual `xlink:href`
// literal name isn't found.
const XLINK_NS = "http://www.w3.org/1999/xlink";

export interface WmsCapabilitiesData {
  /** Service `OnlineResource` (GetMap base URL). */
  url: string | null;
  /** Advertised WMS version, e.g. `1.3.0`. */
  version: string | null;
  /** Time (and other) dimensions of the requested layer, if any. */
  dimensions: WMSCapabilityDimension[] | null;
  /** Legends advertised by the requested layer's styles. */
  legends: Legend[];
  /** A list of supported CRS */
  availableCrs: string[];
  /**  Are the layer features queryable ? */
  queryable: boolean;
  /**  information on how to reach features from a WMS server approach*/
  getFeatureInfoCapability: {
    baseUrl: string;
    method: "GET" | "POST";
    formats: string[];
  } | null;
}

export function useWmsCapabilities(
  serviceData: Ref<Service | null>,
  layerId: Ref<string | null>,
) {
  const { capabilityUrl } = useCapabilities(serviceData);

  const {
    data: wmsCapabilityData,
    onFetchResponse: onCapabilitiesResponse,
    onRequestError: onCapabilitiesError,
  } = useConditionalFetch<string>(capabilityUrl);

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
    capabilityUrl,
    onCapabilitiesError,
    onCapabilitiesResponse,
    wmsData,
  };
}

/**
 * Parses the relevant bits of a WMS GetCapabilities document without depending
 * on OpenLayers. ogc-client (1.3.0) does not expose WMS layer dimensions, so we
 * read the service URL, version and the requested layer's dimensions and
 * legends directly from the XML. This is intentionally a small, local parser
 * (see GPS-804); it can later be replaced by upstream ogc-client support.
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
      legends: [],
      availableCrs: [],
      queryable: false,
      getFeatureInfoCapability: null,
    };
  }

  const doc = new DOMParser().parseFromString(capabilityData, "text/xml");
  const layer = getLayer(doc, layerId);
  if (!layer) {
    throw new Error(`WMS capabilities do not contain layer "${layerId}"`);
  }

  return {
    version: doc.documentElement?.getAttribute("version") ?? null,
    url: getServiceUrl(doc),
    dimensions: getLayerDimensions(layer),
    legends: getLegends(layer),
    availableCrs: getAvailableCrs(layer),
    queryable: isQueryable(layer),
    getFeatureInfoCapability: getFeatureInfoCapability(doc),
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
  return getXlinkHref(onlineResource);
}

/**
 * The requested layer, wherever it sits: a layer is not always a direct child of
 * the root one, it can be nested in any number of groups.
 *
 * Exported for tests (resolving a layer element to feed `getLegends`).
 */
export function getLayer(doc: Document, layerId: string): Element | undefined {
  return Array.from(doc.getElementsByTagName("Layer")).find(
    (candidate) =>
      firstDirectChild(candidate, "Name")?.textContent?.trim() === layerId,
  );
}

export function getDimensions(
  doc: Document,
  layerId: string,
): WMSCapabilityDimension[] | null {
  return getLayerDimensions(getLayer(doc, layerId));
}

function getLayerDimensions(
  layer: Element | undefined,
): WMSCapabilityDimension[] | null {
  if (!layer) {
    return null;
  }

  const dimensions = directChildren(layer, "Dimension").map(parseDimension);
  return dimensions.length ? dimensions : null;
}

/**
 * Legends of the requested layer, one per style that advertises one. Styles are
 * inherited from the enclosing groups, as the WMS spec prescribes, so a layer
 * nested in a group also carries the legends the group publishes. The layer's
 * own legends come first.
 */
export function getLegends(layerElement: Element): Legend[] {
  if (!layerElement) {
    return [];
  }

  const legends: Legend[] = [];
  for (
    let candidate: Element | null = layerElement;
    candidate?.localName === "Layer";
    candidate = candidate.parentElement
  ) {
    legends.push(
      ...directChildren(candidate, "Style")
        .flatMap((style) => directChildren(style, "LegendURL"))
        .map(parseLegend)
        .filter((legend): legend is Legend => !!legend),
    );
  }
  return legends;
}

function parseLegend(element: Element): Legend | undefined {
  const onlineResource = firstDirectChild(element, "OnlineResource");
  const href = getXlinkHref(onlineResource);
  if (!href) {
    return;
  }

  const width = element.getAttribute("width");
  const height = element.getAttribute("height");
  return {
    href,
    format: firstDirectChild(element, "Format")?.textContent?.trim(),
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
  };
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

function getFeatureInfoCapability(doc: Document): {
  baseUrl: string;
  method: "GET" | "POST";
  formats: string[];
} {
  const capability = doc.getElementsByTagName("Capability")[0];
  if (!capability) {
    return null;
  }

  const requestNode = firstDirectChild(capability, "Request");

  if (!requestNode) {
    return null;
  }

  const getFeatureInfoNode = firstDirectChild(requestNode, "GetFeatureInfo");

  if (!getFeatureInfoNode) {
    return null;
  }

  const formats = directChildren(getFeatureInfoNode, "Format")
    .map((format) => format.textContent?.trim() ?? "")
    .filter((format) => Boolean(format));

  if (formats.length < 1) {
    return null;
  }

  for (const verb of ["Get", "Post"] as const) {
    for (const dcp of directChildren(getFeatureInfoNode, "DCPType")) {
      const httpElement = firstDirectChild(dcp, "HTTP");
      const verbNode = firstDirectChild(httpElement, verb);
      if (verbNode) {
        const baseUrl = getXlinkHref(
          firstDirectChild(verbNode, "OnlineResource"),
        );
        if (baseUrl) {
          return {
            baseUrl,
            method: verb.toUpperCase() as "POST" | "GET",
            formats,
          };
        }
      }
    }
  }
  return null;
}

function isQueryable(layerElement: Element) {
  const queryable = layerElement.getAttribute("queryable");
  // WMS 1.3.0 returns "1" or "0", some servers return a stringified boolean
  return queryable === "1" || queryable === "true";
}

function directChildren(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter(
    (child) => child.localName === localName,
  );
}

function getAvailableCrs(layerElement: Element) {
  for (
    let candidate: Element | null = layerElement;
    candidate?.localName === "Layer";
    candidate = candidate.parentElement
  ) {
    const supportedCrs = [
      ...directChildren(candidate, "CRS"),
      ...directChildren(candidate, "SRS"),
    ]
      .map((el) => el.textContent?.trim())
      .filter((code): code is string => !!code);
    if (supportedCrs.length > 0) {
      return supportedCrs;
    }
  }

  return ["EPSG:4326"];
}

function firstDirectChild(
  parent: Element,
  localName: string,
): Element | undefined {
  return directChildren(parent, localName)[0];
}

// retrieve the xlink attribute from an element
function getXlinkHref(element: Element | undefined): string | null {
  return (
    element?.getAttribute("xlink:href") ??
    element?.getAttributeNS(XLINK_NS, "href") ??
    null
  );
}
