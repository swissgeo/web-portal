import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import fs from "node:fs";
import { resolve } from "path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ref } from "vue";

import type { Service } from "@/types";

import { useWmtsCapabilities } from "../useWmtsCapabilities";
import ChGeoadminWmts from "./fixtures/service_ch.admin.geo.wmts.json";

const wmtsPath = resolve(
  __dirname,
  "fixtures/capabilities_wmts.geo.admin.ch.xml",
);
const capabilitiesXML = fs.readFileSync(wmtsPath, "utf-8");

describe("useWmtsCapabilities fetching and parsing WMTS capabilities", () => {
  const handlers = [
    http.get(
      "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
      () => {
        return HttpResponse.xml(capabilitiesXML);
      },
    ),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("parses the WMTS capabilities into an ogc-client endpoint", async () => {
    const service = ref<Service>(ChGeoadminWmts as Service);
    const layerId = ref("ch.bafu.radonkarte");

    const { capabilityUrl, wmtsData } = useWmtsCapabilities(service, layerId);
    expect(capabilityUrl.value).toEqual(
      "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
    );

    // `wmtsData` is resolved asynchronously (computedAsync) once the endpoint
    // has fetched and parsed the capabilities.
    await vi.waitUntil(() => wmtsData.value !== null, { timeout: 5000 });
    await flushPromises();

    const endpoint = wmtsData.value?.endpoint;
    expect(endpoint).toBeDefined();
    expect(endpoint?.getLayerByName("ch.bafu.radonkarte")).toBeDefined();
  });

  it("exposes the dimensions of a layer that has dimensions", async () => {
    const service = ref<Service>(ChGeoadminWmts as Service);
    const layerId = ref(
      "ch.bafu.landesforstinventar-vegetationshoehenmodell",
    );

    const { wmtsData } = useWmtsCapabilities(service, layerId);
    await vi.waitUntil(() => wmtsData.value !== null, { timeout: 5000 });
    await flushPromises();

    const dimension = wmtsData.value?.dimensions?.[0];
    expect(dimension?.identifier).toEqual("Time");
    expect(dimension?.defaultValue).toEqual("current");

    // KNOWN GAP (ogc-client 1.3.0): the capabilities XML lists 18 <Value>
    // entries for this dimension, but ogc-client reads <Values> (plural) and
    // therefore always returns an empty list. See dist/wmts/capabilities.js.
    // OpenLayers' parser used to return all of them, so the time slider has no
    // years to offer until this is fixed upstream or parsed locally.
    expect(dimension?.values).toEqual([]);
  });

  it("returns null dimensions for a layer that has none", async () => {
    const service = ref<Service>(ChGeoadminWmts as Service);
    const layerId = ref("ch.bafu.radonkarte");

    const { wmtsData } = useWmtsCapabilities(service, layerId);
    await vi.waitUntil(() => wmtsData.value !== null, { timeout: 5000 });
    await flushPromises();

    expect(wmtsData.value?.dimensions).toBeNull();
  });
});
