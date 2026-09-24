import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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

vi.mock("@swissgeo/log", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import log from "@swissgeo/log";

import { useWmsFeatureInfoCapabilities } from "../useWmsFeatureInfoCapabilities";

const CAPABILITY_URL = "https://example.test/wms-capabilities";
const GFI_BASE_URL = "https://example.test/wms?";

const XLINK_DECL = 'xmlns:xlink="http://www.w3.org/1999/xlink"';

/**
 * Minimal synthetic WMS capabilities around a `target.layer` nested in a
 * `parent.group` (same shape as in `wmsCapabilitiesUtils.spec.ts`, trimmed to
 * what the composable consumes).
 */
function makeSyntheticCapabilitiesXml(options: {
  gfiFormats?: string[];
  omitGetFeatureInfo?: boolean;
  parentCrs?: string[];
  layerCrs?: string[];
  queryable?: string;
}): string {
  const crsEntries = (codes: string[] = []) =>
    codes.map((code) => `<CRS>${code}</CRS>`).join("");
  const getFeatureInfo = options.omitGetFeatureInfo
    ? ""
    : `<GetFeatureInfo>${(options.gfiFormats ?? ["application/json"])
        .map((format) => `<Format>${format}</Format>`)
        .join(
          "",
        )}<DCPType><HTTP><Get><OnlineResource ${XLINK_DECL} xlink:href="${GFI_BASE_URL}"/></Get></HTTP></DCPType></GetFeatureInfo>`;
  const queryableAttr =
    options.queryable === undefined ? "" : ` queryable="${options.queryable}"`;
  return `<?xml version="1.0"?>
<WMS_Capabilities version="1.3.0" ${XLINK_DECL}>
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

describe("useWmsFeatureInfoCapabilities", () => {
  const server = setupServer(
    http.get(CAPABILITY_URL, () =>
      HttpResponse.xml(makeSyntheticCapabilitiesXml({ queryable: "1" })),
    ),
  );

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("stays null while the capability URL is null and fetches nothing", async () => {
    const capabilityUrl = ref<string | null>(null);

    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "target.layer",
      capabilityUrl,
    );

    expect(wmsFeatureInfo.value).toBeNull();
    await flushPromises();
    expect(wmsFeatureInfo.value).toBeNull();
  });

  it("stays null when the layer id is null, even with capabilities data", async () => {
    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      null,
      ref(CAPABILITY_URL),
    );

    await flushPromises();
    expect(wmsFeatureInfo.value).toBeNull();
  });

  it("parses the capability parts of a queryable layer", async () => {
    server.use(
      http.get(CAPABILITY_URL, () =>
        HttpResponse.xml(
          makeSyntheticCapabilitiesXml({
            queryable: "1",
            layerCrs: ["EPSG:2056"],
          }),
        ),
      ),
    );

    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "target.layer",
      ref(CAPABILITY_URL),
    );

    await flushPromises();
    expect(wmsFeatureInfo.value).toEqual({
      availableCrs: ["EPSG:2056"],
      getFeatureInfoCapability: {
        baseUrl: GFI_BASE_URL,
        method: "GET",
        formats: ["application/json"],
      },
      wmsVersion: "1.3.0",
      layerName: "target.layer",
    });
  });

  it("falls back to the root layer's CRS and a null layerName on a layer-name miss (D1)", async () => {
    server.use(
      http.get(CAPABILITY_URL, () =>
        HttpResponse.xml(
          makeSyntheticCapabilitiesXml({
            queryable: "1",
            parentCrs: ["EPSG:2056"],
          }),
        ),
      ),
    );

    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "no.such.layer",
      ref(CAPABILITY_URL),
    );

    await flushPromises();
    expect(wmsFeatureInfo.value).toEqual({
      availableCrs: ["EPSG:2056"],
      getFeatureInfoCapability: {
        baseUrl: GFI_BASE_URL,
        method: "GET",
        formats: ["application/json"],
      },
      wmsVersion: "1.3.0",
      layerName: null,
    });
  });

  it("returns null for a layer that is not queryable", async () => {
    server.use(
      http.get(CAPABILITY_URL, () =>
        HttpResponse.xml(makeSyntheticCapabilitiesXml({ queryable: "0" })),
      ),
    );

    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "target.layer",
      ref(CAPABILITY_URL),
    );

    await flushPromises();
    expect(wmsFeatureInfo.value).toBeNull();
  });

  it("returns null when no GetFeatureInfo is advertised", async () => {
    server.use(
      http.get(CAPABILITY_URL, () =>
        HttpResponse.xml(
          makeSyntheticCapabilitiesXml({
            queryable: "1",
            omitGetFeatureInfo: true,
          }),
        ),
      ),
    );

    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "target.layer",
      ref(CAPABILITY_URL),
    );

    await flushPromises();
    expect(wmsFeatureInfo.value).toBeNull();
  });

  it("warns and stays null when the capabilities cannot be loaded", async () => {
    server.use(http.get(CAPABILITY_URL, () => HttpResponse.error()));

    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "target.layer",
      ref(CAPABILITY_URL),
    );

    await flushPromises();
    expect(wmsFeatureInfo.value).toBeNull();
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining("target.layer"),
    );
  });

  it("starts fetching once the capability URL flips from null to a value", async () => {
    const capabilityUrl = ref<string | null>(null);
    const wmsFeatureInfo = useWmsFeatureInfoCapabilities(
      "target.layer",
      capabilityUrl,
    );

    capabilityUrl.value = CAPABILITY_URL;
    await flushPromises();

    expect(wmsFeatureInfo.value).toEqual(
      expect.objectContaining({ layerName: "target.layer" }),
    );
  });
});
