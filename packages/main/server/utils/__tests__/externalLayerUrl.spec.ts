import { describe, expect, it } from "vitest";

import { decodeCapabilityUrl, encodeCapabilityUrl } from "../externalLayerUrl";

const urls = [
  "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
  "https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0",
  "https://wmts.geo.bs.ch/1.0.0/WMTSCapabilities.xml",
];

describe("externalLayerUrl", () => {
  it.each(urls)("round-trips %s through encode/decode", (url) => {
    expect(decodeCapabilityUrl(encodeCapabilityUrl(url))).toBe(url);
  });

  // The whole point of base64url over encodeURIComponent (GPS-804): the result
  // must survive as a single path segment, so it may only contain characters a
  // reverse proxy won't reject — no `/`, `+`, `=` or `%`.
  it.each(urls)("encodes %s to the base64url charset only", (url) => {
    expect(encodeCapabilityUrl(url)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
