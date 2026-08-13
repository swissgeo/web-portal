import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useOgcWmtsData } from "../useOgcWmtsData";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
    locale: { value: "fr" },
  });
});

const {
  useStyleMock,
  useWmtsCapabilitiesMock,
  defaultOpacityFromStyleMock,
  wmtsDataMock,
  getTimeInfoFromWMTSCapabilitiesMock,
  buildWmtsOptionsMock,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  const styleDataMock = ref({});
  const wmtsDataMock = ref<unknown>(null);

  const useWmtsCapabilitiesMock = vi.fn(
    (service, layer, _onError: (_error: unknown) => void) => ({
      capabilityUrl: computed(() => service.value?.url ?? null),
      // Some tests need the endpoint to react to service and layer changes.
      wmtsData:
        service.value && layer.value
          ? computed(() => ({
              endpoint: { serviceUrl: service.value.url },
              dimensions: null,
            }))
          : wmtsDataMock,
    }),
  );

  return {
    useStyleMock: vi.fn(() => ({
      styleData: styleDataMock,
    })),
    useWmtsCapabilitiesMock,
    styleDataMock,
    wmtsDataMock,
    defaultOpacityFromStyleMock: vi.fn(() => 0.42),
    getTimeInfoFromWMTSCapabilitiesMock: vi.fn(() => ({
      availableTimes: [2025, 2026],
      defaultTime: 2026,
    })),
    // stands in for map's buildWmtsOptions: echoes back the endpoint + layer so
    // tests can assert the async options wiring without OpenLayers.
    buildWmtsOptionsMock: vi.fn(
      (
        endpoint: { serviceUrl?: string },
        layerName: string,
      ): Promise<{ url: string | undefined; layerId: string } | null> =>
        Promise.resolve({
          url: endpoint?.serviceUrl,
          layerId: layerName,
        }),
    ),
  };
});

vi.mock("@swissgeo/ogc", () => ({
  useStyle: useStyleMock,
  useWmtsCapabilities: useWmtsCapabilitiesMock,
}));

vi.mock("@swissgeo/map", () => ({
  buildWmtsOptions: buildWmtsOptionsMock,
}));

vi.mock("../defaultFromOpacity", () => ({
  defaultOpacityFromStyle: defaultOpacityFromStyleMock,
}));

vi.mock("@/utils/timeUtils", () => ({
  getTimeInfoFromWMTSCapabilities: getTimeInfoFromWMTSCapabilitiesMock,
}));

describe("useOgcWmtsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wmtsDataMock.value = null;
  });

  it("calls the right composables", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    // @ts-expect-error Not caring about the types here
    useOgcWmtsData(distribution, service, layerId);

    expect(useStyleMock).toHaveBeenCalledTimes(1);
    expect(useStyleMock).toHaveBeenCalledWith(distribution);
    expect(useWmtsCapabilitiesMock).toHaveBeenCalledWith(
      service,
      layerId,
      expect.any(Function),
    );
  });

  it("preserves the WMTS capabilities request error", () => {
    const requestError = new Error("request failed");
    const onError = vi.fn();

    // @ts-expect-error Not caring about the types here
    useOgcWmtsData(ref({}), ref({}), ref(null), onError);
    const reportCapabilitiesError = useWmtsCapabilitiesMock.mock.calls[0]?.[2];
    expect(reportCapabilitiesError).toBeDefined();
    reportCapabilitiesError?.(requestError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        cause: requestError,
        message: "Unable to load required WMTS capabilities",
      }),
    );
  });

  it("extracts the timeInfo correctly", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    // @ts-expect-error Not caring about the types here
    const { timeInfo } = useOgcWmtsData(distribution, service, layerId);
    expect(timeInfo.value).toEqual({
      defaultTime: 2026,
      availableTimes: [2025, 2026],
    });
  });

  it("builds the wmts options from the parsed endpoint", async () => {
    const distribution = ref({});
    const service = ref({ url: "http://wmts.geo.admin.ch" });
    const layerId = ref("ch.bafu.radonkarte");

    const { options, timeInfo, defaultOpacity } = useOgcWmtsData(
      // @ts-expect-error Not caring about the types here
      distribution,
      service,
      layerId,
    );

    // options are produced asynchronously via map's buildWmtsOptions
    await flushPromises();

    expect(buildWmtsOptionsMock).toHaveBeenCalledWith(
      { serviceUrl: "http://wmts.geo.admin.ch" },
      "ch.bafu.radonkarte",
    );
    expect(options.value).toEqual({
      url: "http://wmts.geo.admin.ch",
      layerId: "ch.bafu.radonkarte",
    });
    expect(timeInfo.value).toEqual({
      defaultTime: 2026,
      availableTimes: [2025, 2026],
    });
    expect(defaultOpacity.value).toEqual(0.42);
    expect(defaultOpacityFromStyleMock).toHaveBeenCalled();
  });

  it("passes the parsed dimensions to getTimeInfoFromWMTSCapabilities", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");

    const dimensions = [
      {
        identifier: "time",
        defaultValue: "2026",
        values: ["2026", "2025"],
      },
    ];
    wmtsDataMock.value = {
      endpoint: { serviceUrl: "http://wmts.geo.admin.ch" },
      dimensions,
    };

    const { timeInfo } = useOgcWmtsData(
      // @ts-expect-error Not caring about the types here
      distribution,
      service,
      layerId,
    );
    // access the computed so it evaluates and calls the (mocked) adapter
    void timeInfo.value;

    expect(getTimeInfoFromWMTSCapabilitiesMock).toHaveBeenCalledWith(
      dimensions,
    );
  });

  it("updates the options reactively when the endpoint changes", async () => {
    const distribution = ref({});
    const service = ref({ url: "http://wmts.geo.admin.ch" });
    const layerId = ref("first-layer");

    const { options } = useOgcWmtsData(
      // @ts-expect-error Not caring about the types here
      distribution,
      service,
      layerId,
    );

    await flushPromises();
    expect(options.value).toHaveProperty("url", "http://wmts.geo.admin.ch");
    expect(options.value).toHaveProperty("layerId", "first-layer");

    service.value = { url: "http://wmts.swissgeo.ch" };
    layerId.value = "second-layer";
    await flushPromises();

    expect(options.value).toHaveProperty("url", "http://wmts.swissgeo.ch");
    expect(options.value).toHaveProperty("layerId", "second-layer");
  });

  it("preserves an options builder error", async () => {
    const optionsError = new Error("options failed");
    const onError = vi.fn();
    buildWmtsOptionsMock.mockRejectedValueOnce(optionsError);

    const distribution = ref({});
    const service = ref({ url: "http://wmts.geo.admin.ch" });
    const layerId = ref("broken-layer");

    // @ts-expect-error Not caring about the types here
    useOgcWmtsData(distribution, service, layerId, onError);
    await flushPromises();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        cause: optionsError,
        message: "Unable to build required WMTS layer options",
      }),
    );
  });

  it("reports unusable final WMTS options", async () => {
    const onError = vi.fn();
    buildWmtsOptionsMock.mockResolvedValueOnce(null);

    const distribution = ref({});
    const service = ref({ url: "http://wmts.geo.admin.ch" });
    const layerId = ref("missing-layer");

    // @ts-expect-error Not caring about the types here
    useOgcWmtsData(distribution, service, layerId, onError);
    await flushPromises();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "WMTS capabilities contain no usable layer options",
      }),
    );
  });
});

describe("useOgcWmtsData reactivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Doesn't recompute the style if only the service data changes", async () => {
    const distribution = ref({});
    const service = ref({
      url: "http://swissgeo.ch",
    });
    const layerId = ref("umtriebiger-pilzknöterich");

    const { options, defaultOpacity } = useOgcWmtsData(
      // @ts-expect-error Intentionally not providing the right types
      distribution,
      service,
      layerId,
    );
    await flushPromises();
    expect(options.value).toHaveProperty("url", "http://swissgeo.ch");
    expect(options.value).toHaveProperty(
      "layerId",
      "umtriebiger-pilzknöterich",
    );

    service.value = {
      url: "http://geo.admin.ch",
    };
    await flushPromises();
    expect(options.value).toHaveProperty("url", "http://geo.admin.ch");

    layerId.value = "runzelblättriges-opakraut";
    await flushPromises();
    expect(options.value).toHaveProperty(
      "layerId",
      "runzelblättriges-opakraut",
    );
    expect(defaultOpacity.value).toEqual(0.42);
    // even if the input for service changes, we want the style to remain the same!
    expect(defaultOpacityFromStyleMock).toHaveBeenCalledTimes(1);
  });
});
