import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import { useOgcGeoJsonData } from "../useOgcGeoJsonData";

const {
  geoJsonDataMock,
  mapLibreStyleMock,
  mapLibreIconsMock,
  errorMock,
  useGeoJsonMock,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    geoJsonDataMock: ref<unknown>(null),
    mapLibreStyleMock: ref<unknown>(null),
    mapLibreIconsMock: ref<unknown>([]),
    errorMock: ref<unknown>(null),
    useGeoJsonMock: vi.fn(() => ({
      geoJsonData: geoJsonDataMock,
      mapLibreStyle: mapLibreStyleMock,
      mapLibreIcons: mapLibreIconsMock,
      error: errorMock,
    })),
  };
});

vi.mock("@swissgeo/ogc", () => ({
  useGeoJson: useGeoJsonMock,
}));

const sampleGeoJsonData = { type: "FeatureCollection", features: [] };
const sampleStyle = { version: 8, sources: {}, layers: [] };
const sampleIcons = [
  { name: "sg-triangle-12-#808080-#FFFFFF-1", shape: "triangle", radius: 12 },
];

describe("useOgcGeoJsonData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geoJsonDataMock.value = null;
    mapLibreStyleMock.value = null;
    mapLibreIconsMock.value = [];
    errorMock.value = null;
  });

  it("calls useGeoJson with the distribution", () => {
    const distribution = ref(null);
    useOgcGeoJsonData(distribution, vi.fn());

    expect(useGeoJsonMock).toHaveBeenCalledWith(distribution);
  });

  it("returns null while data and style are loading", () => {
    const { geoJsonLayerData } = useOgcGeoJsonData(ref(null), vi.fn());
    expect(geoJsonLayerData.value).toBeNull();
  });

  it("maps data and style payload to layer data", () => {
    geoJsonDataMock.value = sampleGeoJsonData;
    mapLibreStyleMock.value = sampleStyle;
    mapLibreIconsMock.value = sampleIcons;

    const { geoJsonLayerData } = useOgcGeoJsonData(ref(null), vi.fn());
    expect(geoJsonLayerData.value).toEqual({
      geoJsonData: sampleGeoJsonData,
      mapLibreStyle: sampleStyle,
      mapLibreIcons: sampleIcons,
    });
  });

  it("does not emit layer data while the style is missing", () => {
    geoJsonDataMock.value = sampleGeoJsonData;

    const { geoJsonLayerData } = useOgcGeoJsonData(ref(null), vi.fn());
    expect(geoJsonLayerData.value).toBeNull();
  });

  it("reports style errors through onError", () => {
    const onError = vi.fn();
    errorMock.value = new Error("GeoJSON distribution has no styledBy link");

    useOgcGeoJsonData(ref(null), onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "GeoJSON distribution has no styledBy link",
      }),
    );
  });

  it("reports errors that appear later through onError", async () => {
    const onError = vi.fn();
    useOgcGeoJsonData(ref(null), onError);

    expect(onError).not.toHaveBeenCalled();

    errorMock.value = new Error("Unable to load GeoJSON style");
    await nextTick();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
