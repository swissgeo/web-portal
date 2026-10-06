// XLink namespace URI, fixed by the W3C XLink spec and required by the WMS
// schema for `OnlineResource`. Only the prefix bound to it can vary between
// servers, so we read the attribute by namespace when the usual `xlink:href`
// literal name isn't found.
const XLINK_NS = "http://www.w3.org/1999/xlink";

export function getFeatureInfoCapability(doc: Document): {
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

export function isQueryable(layerElement: Element) {
  const queryable = layerElement.getAttribute("queryable");
  // WMS 1.3.0 returns "1" or "0", some servers return a stringified boolean
  return queryable === "1" || queryable === "true";
}

export function getAvailableCrs(layerElement: Element) {
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

// retrieve the xlink attribute from an element
export function getXlinkHref(element: Element | undefined): string | null {
  return (
    element?.getAttribute("xlink:href") ??
    element?.getAttributeNS(XLINK_NS, "href") ??
    null
  );
}

export function directChildren(
  parent: Element | undefined | null,
  localName: string,
): Element[] {
  return Array.from(parent?.children ?? []).filter(
    (child) => child.localName === localName,
  );
}

export function firstDirectChild(
  parent: Element,
  localName: string,
): Element | undefined {
  return directChildren(parent, localName)[0];
}

export function getRootLayer(document: Document) {
  return Array.from(document.getElementsByTagName("Layer"))[0];
}

export function getLayerName(layerElement: Element) {
  return firstDirectChild(layerElement, "Name")?.textContent?.trim() ?? null;
}
