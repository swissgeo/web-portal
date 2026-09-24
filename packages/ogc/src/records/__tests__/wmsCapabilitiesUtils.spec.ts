import fs from "node:fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

import { getLayer } from "../useWmsCapabilities";
import {
  directChildren,
  getAvailableCrs,
  getFeatureInfoCapability,
  getLayerName,
  getRootLayer,
  isQueryable,
} from "../wmsCapabilitiesUtils";

const wmsPath = resolve(
  __dirname,
  "fixtures/capabilities_wms.geo.admin.ch.xml",
);
const capabilitiesXML = fs.readFileSync(wmsPath, "utf-8");

// Parsing the multi-MB capabilities fixture can exceed the default 5s timeout
// when the whole monorepo suite runs in parallel.
const FIXTURE_PARSING_TIMEOUT = 30_000;

const parse = (xml: string) => new DOMParser().parseFromString(xml, "text/xml");

const XLINK_DECL = 'xmlns:xlink="http://www.w3.org/1999/xlink"';

/**
 * Minimal synthetic WMS capabilities around a `target.layer` nested in a
 * `parent.group`
 */
function makeSyntheticCapabilitiesXml(options: {
  version?: string;
  gfiFormats?: string[];
  gfiVerbs?: Array<"Get" | "Post">;
  omitGetFeatureInfo?: boolean;
  parentCrs?: string[];
  layerCrs?: string[];
  useSrs?: boolean;
  queryable?: string;
  layerName?: string;
}): string {
  const crsTag = options.useSrs ? "SRS" : "CRS";
  const crsEntries = (codes: string[] = []) =>
    codes.map((code) => `<${crsTag}>${code}</${crsTag}>`).join("");
  const getFeatureInfo = options.omitGetFeatureInfo
    ? ""
    : `<GetFeatureInfo>${(options.gfiFormats ?? ["application/json"])
        .map((format) => `<Format>${format}</Format>`)
        .join("")}<DCPType><HTTP>${(options.gfiVerbs ?? ["Get"])
        .map(
          (verb) =>
            `<${verb}><OnlineResource ${XLINK_DECL} xlink:href="https://example.test/wms?"/></${verb}>`,
        )
        .join("")}</HTTP></DCPType></GetFeatureInfo>`;
  const queryableAttr =
    options.queryable === undefined ? "" : ` queryable="${options.queryable}"`;
  const layerName = options.layerName ?? "target.layer";
  return `<?xml version="1.0"?>
<WMS_Capabilities version="${options.version ?? "1.3.0"}" ${XLINK_DECL}>
  <Service>
    <OnlineResource xlink:href="https://example.test/service?"/>
  </Service>
  <Capability>
    <Request>${getFeatureInfo}</Request>
    <Layer>
      <Name>parent.group</Name>
      ${crsEntries(options.parentCrs)}
      <Layer${queryableAttr}>
        <Name>${layerName}</Name>
        ${crsEntries(options.layerCrs)}
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
}

const syntheticDoc = (
  options: Parameters<typeof makeSyntheticCapabilitiesXml>[0],
) => parse(makeSyntheticCapabilitiesXml(options));

/** The `target.layer` element of a synthetic capabilities document. */
function targetLayer(doc: Document): Element {
  const layer = getLayer(doc, "target.layer");
  expect(layer).toBeDefined();
  return layer!;
}

describe("getFeatureInfoCapability", () => {
  it(
    "extracts the service-level GetFeatureInfo capability, GET preferred",
    { timeout: FIXTURE_PARSING_TIMEOUT },
    () => {
      const capability = getFeatureInfoCapability(parse(capabilitiesXML));

      expect(capability).toEqual({
        baseUrl: "https://wms.geo.admin.ch/de/?",
        method: "GET",
        formats: [
          "application/json",
          "application/json; subtype=geojson",
          "application/vnd.ogc.gml",
          "text/plain",
          "text/xml",
          "text/xml; subtype=gml/3.1.1",
          "text/xml; subtype=gml/3.2.1",
        ],
      });
    },
  );

  it("falls back to the POST endpoint when no GET OnlineResource is advertised", () => {
    const capability = getFeatureInfoCapability(
      syntheticDoc({ gfiVerbs: ["Post"] }),
    );

    expect(capability?.method).toBe("POST");
  });

  it("returns a null capability when GetFeatureInfo is not advertised", () => {
    expect(
      getFeatureInfoCapability(syntheticDoc({ omitGetFeatureInfo: true })),
    ).toBeNull();
  });

  it("returns a null capability when no format is advertised", () => {
    expect(
      getFeatureInfoCapability(syntheticDoc({ gfiFormats: [] })),
    ).toBeNull();
  });
});

describe("getAvailableCrs", () => {
  it("inherits the CRS list from the enclosing group when the layer declares none", () => {
    const doc = syntheticDoc({ parentCrs: ["EPSG:2056", "EPSG:21781"] });

    expect(getAvailableCrs(targetLayer(doc))).toEqual([
      "EPSG:2056",
      "EPSG:21781",
    ]);
  });

  it("keeps the layer's own CRS list over the parent's (nearest wins)", () => {
    const doc = syntheticDoc({
      parentCrs: ["EPSG:2056"],
      layerCrs: ["EPSG:4326"],
    });

    expect(getAvailableCrs(targetLayer(doc))).toEqual(["EPSG:4326"]);
  });

  it("defaults to WGS84 when no layer in the chain declares any CRS", () => {
    const doc = syntheticDoc({});

    expect(getAvailableCrs(targetLayer(doc))).toEqual(["EPSG:4326"]);
  });

  it("reads <SRS> entries on pre-1.3.0 capabilities", () => {
    const doc = syntheticDoc({
      version: "1.1.1",
      layerCrs: ["EPSG:21781"],
      useSrs: true,
    });

    expect(getAvailableCrs(targetLayer(doc))).toEqual(["EPSG:21781"]);
  });

  it("degrades to WGS84 for a missing layer element (D1 fallback)", () => {
    expect(getAvailableCrs(undefined)).toEqual(["EPSG:4326"]);
    expect(getAvailableCrs(null)).toEqual(["EPSG:4326"]);
  });
});

describe("isQueryable", () => {
  it.each(["1", "true"])('reports queryable="%s" as queryable', (value) => {
    expect(
      isQueryable(
        syntheticDoc({ queryable: value }).getElementsByTagName("Layer")[1]!,
      ),
    ).toBe(true);
  });

  it.each(["0", "false", undefined])(
    "reports queryable=%s as not queryable",
    (value) => {
      expect(
        isQueryable(
          syntheticDoc({ queryable: value }).getElementsByTagName("Layer")[1]!,
        ),
      ).toBe(false);
    },
  );
});

describe("getLayerName", () => {
  it("returns the trimmed <Name> of the layer element", () => {
    expect(getLayerName(targetLayer(syntheticDoc({})))).toBe("target.layer");
  });

  it("returns null when the layer element has no <Name> child", () => {
    const doc = parse(`<?xml version="1.0"?>
<WMS_Capabilities version="1.3.0">
  <Capability>
    <Layer><Title>a nameless layer</Title></Layer>
  </Capability>
</WMS_Capabilities>`);

    expect(getLayerName(doc.getElementsByTagName("Layer")[0]!)).toBeNull();
  });

  it("returns null for a missing layer element (D1 fallback)", () => {
    expect(getLayerName(undefined)).toBeNull();
    expect(getLayerName(null)).toBeNull();
  });
});

describe("getRootLayer", () => {
  it("returns the first layer element of the document", () => {
    const doc = syntheticDoc({});

    expect(getLayerName(getRootLayer(doc))).toBe("parent.group");
  });

  it("returns undefined when the document declares no layer at all", () => {
    const doc = parse(
      `<?xml version="1.0"?><WMS_Capabilities version="1.3.0"><Capability/></WMS_Capabilities>`,
    );

    expect(getRootLayer(doc)).toBeUndefined();
  });
});

describe("directChildren", () => {
  it("returns an empty list for null or undefined parents", () => {
    expect(directChildren(null, "Name")).toEqual([]);
    expect(directChildren(undefined, "Name")).toEqual([]);
  });
});
