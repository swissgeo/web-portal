import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useOgcWmsData } from "../useOgcWmsData";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
    locale: { value: "fr" },
  });
});

const {
  capabilityUrlMock,
  onCapabilitiesResponseMock,
  useStyleMock,
  useWmsCapabilitiesMock,
  styleDataMock,
  wmsDataMock,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  const styleDataMock = ref({});
  const wmsDataMock = ref({});
  const capabilityUrlMock = ref("capabilities-url");
  const onCapabilitiesErrorMock = vi.fn();
  const onCapabilitiesResponseMock = vi.fn();

  return {
    capabilityUrlMock,
    onCapabilitiesErrorMock,
    onCapabilitiesResponseMock,
    useStyleMock: vi.fn(() => ({
      styleData: styleDataMock,
    })),
    useWmsCapabilitiesMock: vi.fn(() => ({
      capabilityUrl: capabilityUrlMock,
      onCapabilitiesError: onCapabilitiesErrorMock,
      onCapabilitiesResponse: onCapabilitiesResponseMock,
      wmsData: wmsDataMock,
    })),
    styleDataMock,
    wmsDataMock,
  };
});

vi.mock("@swissgeo/ogc", () => ({
  useStyle: useStyleMock,
  useWmsCapabilities: useWmsCapabilitiesMock,
}));

vi.mock("@/utils/timeUtils", () => ({
  getTimeInfoFromWMSCapabilities: vi.fn(() => ({
    availableTimes: [2021, 2022],
    defaultTime: 2022,
  })),
}));

describe("useOgcWmsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capabilityUrlMock.value = "capabilities-url";
    styleDataMock.value = {};
    wmsDataMock.value = {};
  });

  it("calls the right composables", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    // @ts-expect-error Not caring about the types here
    useOgcWmsData(distribution, service, layerId, vi.fn());

    expect(useStyleMock).toHaveBeenCalledTimes(1);
    expect(useStyleMock).toHaveBeenCalledWith(distribution);
    expect(useWmsCapabilitiesMock).toHaveBeenCalledWith(service, layerId);
  });

  it("extracts the timeInfo correctly", () => {
    wmsDataMock.value = {
      wmsData: {
        dimensions: [
          {
            name: "test",
            values: [2020, 2021],
          },
        ],
      },
    };

    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    // @ts-expect-error Intentionally not caring about the types
    const { timeInfo } = useOgcWmsData(distribution, service, layerId, vi.fn());
    expect(timeInfo.value).toEqual({
      defaultTime: 2022,
      availableTimes: [2021, 2022],
    });
  });

  it("returns the correct WMS data", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    const onError = vi.fn();

    wmsDataMock.value = {
      url: "http://swissgeo.ch",
      version: "1.3.0",
    };

    // @ts-expect-error Intentionally not caring about the types
    const result = useOgcWmsData(distribution, service, layerId, onError);
    const { wmsDataForOl } = result;
    expect(wmsDataForOl.value).toEqual({
      url: "http://swissgeo.ch",
      version: "1.3.0",
      gutter: 0,
      lang: "fr",
    });
  });

  it("changes the output data reactively when the input changes", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    const onError = vi.fn();

    wmsDataMock.value = {
      url: "http://swissgeo.ch",
      version: "1.3.0",
    };

    // @ts-expect-error Intentionally not caring about the types
    const result = useOgcWmsData(distribution, service, layerId, onError);
    const { wmsDataForOl } = result;
    expect(wmsDataForOl.value).toEqual({
      url: "http://swissgeo.ch",
      version: "1.3.0",
      gutter: 0,
      lang: "fr",
    });

    wmsDataMock.value = {
      url: "http://geo.admin.ch",
      version: "1.3.0",
    };

    // no need to re-use the composable, the data itself is reactive!
    expect(wmsDataForOl.value).toEqual({
      url: "http://geo.admin.ch",
      version: "1.3.0",
      gutter: 0,
      lang: "fr",
    });
  });

  it("extracts gutter from style data", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    const onError = vi.fn();

    styleDataMock.value = {
      id: "ch.bafu.gefahren-aktuelle_erdbeben:wms:style",
      layers: [
        {
          id: "ch.bafu.gefahren-aktuelle_erdbeben:wms:style",
          paint: {
            "raster-gutter": 25,
          },
          source: "wms.geo.admin.ch",
          type: "raster",
        },
      ],
    };

    wmsDataMock.value = {
      url: "http://swissgeo.ch",
      version: "1.3.0",
    };

    // @ts-expect-error Intentionally not caring about the types
    const result = useOgcWmsData(distribution, service, layerId, onError);
    const { wmsDataForOl } = result;
    expect(wmsDataForOl.value?.gutter).toEqual(25);
  });

  it("reports unusable capabilities", () => {
    const onError = vi.fn();
    wmsDataMock.value = {
      url: null,
      version: "1.3.0",
      dimensions: null,
    };

    // @ts-expect-error Intentionally not caring about the input types
    useOgcWmsData(ref({}), ref({}), ref("layer"), onError);
    onCapabilitiesResponseMock.mock.calls[0]![0]();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unable to process required WMS capabilities",
        cause: expect.objectContaining({
          message: "WMS capabilities contain no usable layer data",
        }),
      }),
    );
  });

  it("reports a capabilities parsing exception", () => {
    const onError = vi.fn();
    const parseError = new Error("missing WMS layer");
    const valueSpy = vi
      .spyOn(wmsDataMock, "value", "get")
      .mockImplementationOnce(() => {
        throw parseError;
      });

    // @ts-expect-error Intentionally not caring about the input types
    useOgcWmsData(ref({}), ref({}), ref("layer"), onError);
    onCapabilitiesResponseMock.mock.calls[0]![0]();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unable to process required WMS capabilities",
        cause: parseError,
      }),
    );
    valueSpy.mockRestore();
  });
});
