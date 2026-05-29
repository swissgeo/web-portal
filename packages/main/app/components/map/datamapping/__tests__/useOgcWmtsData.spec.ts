import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeAll, describe, expect, it, vi } from "vitest";

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
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  const styleDataMock = ref({});
  const wmtsDataMock = ref({});

  const useWmtsCapabilitiesMock = vi.fn((service, layer) => {
    // for most tests, we stupidly just return the mocked ref (see else block)
    // for some though, we want it to react to the input, hence the returning of data from
    // the params
    if (service.value && layer.value) {
      return {
        wmtsData: computed(() => ({
          options: {
            url: service.value.url,
            layerId: layer.value,
          },
        })),
      };
    } else {
      return {
        wmtsData: wmtsDataMock,
      };
    }
  });

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
  };
});

vi.mock("@swissgeo/ogc", () => ({
  useStyle: useStyleMock,
  useWmtsCapabilities: useWmtsCapabilitiesMock,
}));

vi.mock("@/utils/timeUtils", () => ({
  getTimeInfoFromWMTSCapabilities: vi.fn(() => ({
    availableTimes: [2021, 2022],
    defaultTime: 2022,
  })),
}));

vi.mock("../defaultFromOpacity", () => ({
  defaultOpacityFromStyle: defaultOpacityFromStyleMock,
}));

vi.mock("@/utils/timeUtils", () => ({
  getTimeInfoFromWMTSCapabilities: getTimeInfoFromWMTSCapabilitiesMock,
}));

describe("useOgcWmtsData", () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  it("calls the right composables", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");
    // @ts-expect-error Not caring about the types here
    useOgcWmtsData(distribution, service, layerId);

    expect(useStyleMock).toHaveBeenCalledTimes(1);
    expect(useStyleMock).toHaveBeenCalledWith(distribution);
    expect(useWmtsCapabilitiesMock).toHaveBeenCalledWith(service, layerId);
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

  it("assembles the wmts data correctly from the useWmtsCapababilities composable", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");

    wmtsDataMock.value = {
      options: {
        version: 1.337,
        url: "http://wmts.geo.admin.ch",
      },
      dimensions: [
        {
          Identifier: "time",
          Default: 2026,
          Value: ["2026", "2025"],
        },
      ],
    };

    const { options, timeInfo, defaultOpacity } = useOgcWmtsData(
      // @ts-expect-error Not caring about the types here
      distribution,
      service,
      layerId,
    );
    expect(options.value).toEqual({
      version: 1.337,
      url: "http://wmts.geo.admin.ch",
    });
    expect(timeInfo.value).toEqual({
      defaultTime: 2026,
      availableTimes: [2025, 2026],
    });
    expect(defaultOpacity.value).toEqual(0.42);

    expect(getTimeInfoFromWMTSCapabilitiesMock).toHaveBeenCalledWith([
      {
        Identifier: "time",
        Default: 2026,
        Value: ["2026", "2025"],
      },
    ]);

    expect(defaultOpacityFromStyleMock).toHaveBeenCalled();
  });

  it("updates the wmts data reactively from the useWmtsCapababilities composable", () => {
    const distribution = ref({});
    const service = ref({});
    const layerId = ref("");

    wmtsDataMock.value = {
      options: {
        version: 1.337,
        url: "http://wmts.geo.admin.ch",
      },
      dimensions: [
        {
          Identifier: "time",
          Default: 2026,
          Value: ["2026", "2025"],
        },
      ],
    };

    const { options, timeInfo, defaultOpacity } = useOgcWmtsData(
      // @ts-expect-error Not caring about the types here
      distribution,
      service,
      layerId,
    );

    expect(timeInfo.value).toEqual({
      defaultTime: 2026,
      availableTimes: [2025, 2026],
    });
    expect(defaultOpacity.value).toEqual(0.42);
    expect(options.value).toHaveProperty("url", "http://wmts.geo.admin.ch");

    wmtsDataMock.value = {
      options: {
        version: 2.019,
        url: "http://wmts.swissgeo.ch",
      },
      dimensions: [
        {
          Identifier: "time",
          Default: 2027,
          Value: ["2020", "2027"],
        },
      ],
    };

    expect(options.value).toHaveProperty("url", "http://wmts.swissgeo.ch");
    expect(options.value).toHaveProperty("version", 2.019);
  });
});

describe("useOgcWmtsData reactivity", () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  it("Doesn't update the style if only the service data changes", () => {
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
    expect(options.value).toHaveProperty("url", "http://swissgeo.ch");
    expect(options.value).toHaveProperty(
      "layerId",
      "umtriebiger-pilzknöterich",
    );

    service.value = {
      url: "http://geo.admin.ch",
    };
    expect(options.value).toHaveProperty("url", "http://geo.admin.ch");
    expect(options.value).toHaveProperty(
      "layerId",
      "umtriebiger-pilzknöterich",
    );

    layerId.value = "runzelblättriges-opakraut";

    expect(options.value).toHaveProperty(
      "layerId",
      "runzelblättriges-opakraut",
    );
    expect(defaultOpacity.value).toEqual(0.42);
    // even if the input for service changes, we want the style to remain the same!
    expect(defaultOpacityFromStyleMock).toHaveBeenCalledTimes(1);
  });
});
