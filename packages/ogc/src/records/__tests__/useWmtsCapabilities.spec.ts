import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import fs from "node:fs";
import { resolve } from "path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Service } from "@/types";

import {
  /*parseWmtsCapabilities,*/ useWmtsCapabilities,
} from "../useWmtsCapabilities";
import WmtsCapabilities from "./fixtures/capabilities_wmts.geo.admin.ch.json";
import ChGeoadminWmts from "./fixtures/service_ch.admin.geo.wmts.json";

const wmsPath = resolve(
  __dirname,
  "fixtures/capabilities_wmts.geo.admin.ch.xml",
);
const capabilitiesXML = fs.readFileSync(wmsPath, "utf-8");

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

  server.events.on("request:start", ({ request }) => {
    console.log("Outgoing:", request.method, request.url);
  });

  server.events.on("request:match", ({ request }) => {
    console.log("Matching:", request.method, request.url);
  });

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("fetches the WMTS capabilities", async () => {
    const service = ref<Service>(ChGeoadminWmts as Service);
    const layerId = ref("ch.bafu.radonkarte");

    const { capabilityUrl, wmtsData } = useWmtsCapabilities(service, layerId);
    await flushPromises();
    expect(capabilityUrl.value).toEqual(
      "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
    );
    expect(wmtsData.value).toBeDefined();
    expect(wmtsData.value?.capabilities).toBeDefined();

    const capabilities = wmtsData.value?.capabilities;
    expect(capabilities).toEqual(WmtsCapabilities);
    // TODO test options
  });
});
