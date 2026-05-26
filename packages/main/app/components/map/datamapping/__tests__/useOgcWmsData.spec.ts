import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOgcWmsData } from "../useOgcWmsData";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
    locale: { value: "fr" },
  });
});

const { useStyleMock, useWmsCapabilitiesMock, styleDataMock, wmsDataMock } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    const styleDataMock = ref({});
    const wmsDataMock = ref({});

    return {
      useStyleMock: vi.fn(() => ({
        styleData: styleDataMock,
      })),
      useWmsCapabilitiesMock: vi.fn(() => ({
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
    styleDataMock.value = {};
    wmsDataMock.value = {};
  });

  it("calls the right composables", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    // @ts-expect-error Not caring about the types here
    useOgcWmsData(distribution, service, layerId);

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
    const { timeInfo } = useOgcWmsData(distribution, service, layerId);
    expect(timeInfo.value).toEqual({
      defaultTime: 2022,
      availableTimes: [2021, 2022],
    });
  });

  it("returns the correct WMS data", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");

    wmsDataMock.value = {
      capabilities: {
        Service: {
          OnlineResource: "http://swissgeo.ch",
        },
        version: "1.3.0",
      },
    };

    // @ts-expect-error Intentionally not caring about the types
    const { wmsDataForOl } = useOgcWmsData(distribution, service, layerId);
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

    wmsDataMock.value = {
      capabilities: {
        Service: {
          OnlineResource: "http://swissgeo.ch",
        },
        version: "1.3.0",
      },
    };

    // @ts-expect-error Intentionally not caring about the types
    const { wmsDataForOl } = useOgcWmsData(distribution, service, layerId);
    expect(wmsDataForOl.value).toEqual({
      url: "http://swissgeo.ch",
      version: "1.3.0",
      gutter: 0,
      lang: "fr",
    });

    wmsDataMock.value = {
      capabilities: {
        Service: {
          OnlineResource: "http://geo.admin.ch",
        },
        version: "1.3.0",
      },
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
      capabilities: {
        Service: {
          OnlineResource: "http://swissgeo.ch",
        },
        version: "1.3.0",
      },
    };

    // @ts-expect-error Intentionally not caring about the types
    const { wmsDataForOl } = useOgcWmsData(distribution, service, layerId);
    expect(wmsDataForOl.value?.gutter).toEqual(25);
  });
});
