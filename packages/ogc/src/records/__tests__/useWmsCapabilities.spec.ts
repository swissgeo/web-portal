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
      });
      expect(parseWmsCapabilities(capabilitiesXML, null)).toEqual({
        url: null,
        version: null,
        dimensions: null,
      });
    });
  },
);

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
