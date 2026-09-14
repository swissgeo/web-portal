import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import fs from "node:fs";
import { resolve } from "path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Service } from "@/types";

import {
  parseWmsCapabilities,
  useWmsCapabilities,
} from "../useWmsCapabilities";
import ChGeoadminWms from "./fixtures/service_ch.admin.geo.wms.json";

const wmsPath = resolve(
  __dirname,
  "fixtures/capabilities_wms.geo.admin.ch.xml",
);
const capabilitiesXML = fs.readFileSync(wmsPath, "utf-8");

const SERVICE_URL = "https://wms.geo.admin.ch/de/?";

// Parsing the multi-MB capabilities fixture can exceed the default 5s timeout
// when the whole monorepo suite runs in parallel.
const FIXTURE_PARSING_TIMEOUT = 30_000;

describe(
  "useWmsCapabilities fetching and parsing WMS capabilities",
  { timeout: FIXTURE_PARSING_TIMEOUT },
  () => {
    const handlers = [
      http.get(
        "https://wms.geo.admin.ch/",
        // MSW doesn't allow query params in the request handler. Adding them here for reference:
        // ?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&FORMAT=text%2Fxml&lang=de
        () => {
          return HttpResponse.xml(capabilitiesXML);
        },
      ),
    ];
    const server = setupServer(...handlers);

    beforeAll(() => server.listen());

    afterAll(() => server.close());

    afterEach(() => server.resetHandlers());

    it("fetches the WMS capabilities", async () => {
      const service = ref<Service>(ChGeoadminWms as Service);
      const layerId = ref("ch.bafu.alpweiden-herdenschutzhunde");

      const { wmsData } = useWmsCapabilities(service, layerId);
      await flushPromises();
      expect(wmsData.value).toBeDefined();
      expect(wmsData.value.version).toEqual("1.3.0");
      expect(wmsData.value.url).toEqual(SERVICE_URL);
    });

    it("fetches the WMS capabilities after the service data becomes available late", async () => {
      const service = ref<Service | null>(null);
      const layerId = ref(
        "ch.bafu.gewaesserschutz-biologischer_zustand_fische",
      );
      const { wmsData } = useWmsCapabilities(service, layerId);

      expect(wmsData.value).toBeDefined();
      expect(wmsData.value.url).toBe(null);
      expect(wmsData.value.version).toBe(null);
      expect(wmsData.value.dimensions).toBe(null);

      service.value = ChGeoadminWms as Service;

      await flushPromises();
      expect(wmsData.value.version).toEqual("1.3.0");
      expect(wmsData.value.url).toEqual(SERVICE_URL);
    });

    it("fetches the WMS capabilities after the layer ID becomes available late", async () => {
      const service = ref<Service | null>(ChGeoadminWms as Service);
      const layerId = ref<string | null>(null);
      const { wmsData } = useWmsCapabilities(service, layerId);

      expect(wmsData.value).toBeDefined();
      expect(wmsData.value.url).toBe(null);
      expect(wmsData.value.version).toBe(null);
      expect(wmsData.value.dimensions).toBe(null);

      layerId.value = "ch.bafu.gewaesserschutz-biologischer_zustand_fische";

      await flushPromises();
      expect(wmsData.value.version).toEqual("1.3.0");
      expect(wmsData.value.url).toEqual(SERVICE_URL);
    });
  },
);

describe(
  "useWmsCapabilities parseWmsCapabilities",
  { timeout: FIXTURE_PARSING_TIMEOUT },
  () => {
    it("extracts url, version and the time dimension", () => {
      const { url, version, dimensions } = parseWmsCapabilities(
        capabilitiesXML,
        "ch.bafu.gewaesserschutz-biologischer_zustand_fische",
      );
      expect(version).toEqual("1.3.0");
      expect(url).toEqual(SERVICE_URL);
      expect(dimensions).toEqual([
        {
          name: "time",
          units: "ISO8601",
          unitSymbol: undefined,
          default: undefined,
          multipleValues: undefined,
          values: "2012/2023",
        },
      ]);
    });

    it("returns null dimensions for a layer with no dimensions", () => {
      const { url, version, dimensions } = parseWmsCapabilities(
        capabilitiesXML,
        "ch.bafu.alpweiden-herdenschutzhunde",
      );
      expect(version).toEqual("1.3.0");
      expect(url).toEqual(SERVICE_URL);
      expect(dimensions).toEqual(null);
    });

    it("throws when the requested layer is missing", () => {
      expect(() =>
        parseWmsCapabilities(capabilitiesXML, "missing-layer"),
      ).toThrow('WMS capabilities do not contain layer "missing-layer"');
    });

    it("returns nulls for empty input", () => {
      expect(parseWmsCapabilities(null, "some-layer")).toEqual({
        url: null,
        version: null,
        dimensions: null,
        legends: [],
        availableCrs: [],
        queryable: false,
        getFeatureInfoCapability: null,
      });
      expect(parseWmsCapabilities(capabilitiesXML, null)).toEqual({
        url: null,
        version: null,
        dimensions: null,
        legends: [],
        availableCrs: [],
        queryable: false,
        getFeatureInfoCapability: null,
      });
    });
  },
);

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
        <Name>target.layer</Name>
        ${crsEntries(options.layerCrs)}
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
}

describe("parseWmsCapabilities to retrieve GetFeatureInfo / queryable / CRS harvest", () => {
  describe("on the real geoadmin fixture", () => {
    it(
      "extracts the service-level GetFeatureInfo capability, GET preferred",
      { timeout: FIXTURE_PARSING_TIMEOUT },
      () => {
        const { getFeatureInfoCapability } = parseWmsCapabilities(
          capabilitiesXML,
          "ch.vbs.armee-kriegsdenkmaeler",
        );

        expect(getFeatureInfoCapability).toEqual({
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

    it(
      "reports the layer as queryable and lists its own CRS entries",
      { timeout: FIXTURE_PARSING_TIMEOUT },
      () => {
        const { queryable, availableCrs } = parseWmsCapabilities(
          capabilitiesXML,
          "ch.vbs.armee-kriegsdenkmaeler",
        );

        expect(queryable).toBe(true);
        expect(availableCrs[0]).toBe("EPSG:2056");
        expect(availableCrs).toContain("EPSG:3857");
      },
    );
  });

  describe("on synthetic capabilities", () => {
    const parse = (xml: string) => parseWmsCapabilities(xml, "target.layer");

    it("inherits the CRS list from the enclosing group when the layer declares none", () => {
      const { availableCrs } = parse(
        makeSyntheticCapabilitiesXml({
          parentCrs: ["EPSG:2056", "EPSG:21781"],
        }),
      );

      expect(availableCrs).toEqual(["EPSG:2056", "EPSG:21781"]);
    });

    it("keeps the layer's own CRS list over the parent's (nearest wins)", () => {
      const { availableCrs } = parse(
        makeSyntheticCapabilitiesXml({
          parentCrs: ["EPSG:2056"],
          layerCrs: ["EPSG:4326"],
        }),
      );

      expect(availableCrs).toEqual(["EPSG:4326"]);
    });

    it("defaults to WGS84 when no layer in the chain declares any CRS", () => {
      const { availableCrs } = parse(makeSyntheticCapabilitiesXml({}));

      expect(availableCrs).toEqual(["EPSG:4326"]);
    });

    it("reads <SRS> entries on pre-1.3.0 capabilities", () => {
      const { version, availableCrs } = parse(
        makeSyntheticCapabilitiesXml({
          version: "1.1.1",
          layerCrs: ["EPSG:21781"],
          useSrs: true,
        }),
      );

      expect(version).toBe("1.1.1");
      expect(availableCrs).toEqual(["EPSG:21781"]);
    });

    it("falls back to the POST endpoint when no GET OnlineResource is advertised", () => {
      const { getFeatureInfoCapability } = parse(
        makeSyntheticCapabilitiesXml({ gfiVerbs: ["Post"] }),
      );

      expect(getFeatureInfoCapability?.method).toBe("POST");
    });

    it("returns a null capability when GetFeatureInfo is not advertised", () => {
      const { getFeatureInfoCapability } = parse(
        makeSyntheticCapabilitiesXml({ omitGetFeatureInfo: true }),
      );

      expect(getFeatureInfoCapability).toBeNull();
    });

    it("returns a null capability when no format is advertised", () => {
      const { getFeatureInfoCapability } = parse(
        makeSyntheticCapabilitiesXml({ gfiFormats: [] }),
      );

      expect(getFeatureInfoCapability).toBeNull();
    });

    it("reports a layer without the queryable attribute as not queryable", () => {
      const { queryable } = parse(makeSyntheticCapabilitiesXml({}));

      expect(queryable).toBe(false);
    });
  });
});

describe("useWmsCapabilities 404", () => {
  const handlers = [
    http.get("https://wms.geo.admin.ch/", () => {
      return HttpResponse.json("Not Found", { status: 404 });
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("doesn't trip with 404", async () => {
    const service = ref<Service>(ChGeoadminWms as Service);
    const layerId = ref("ch.bafu.alpweiden-herdenschutzhunde");

    const { wmsData } = useWmsCapabilities(service, layerId);
    await flushPromises();
    expect(wmsData.value.url).toBe(null);
    expect(wmsData.value.dimensions).toBe(null);
  });
});
