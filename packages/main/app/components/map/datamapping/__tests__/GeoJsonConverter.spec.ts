import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GeoJsonConverter from "../GeoJsonConverter.vue";

const { geoJsonDataRef, geoadminToMapLibreStyleMock, isMapLibreStyleMock } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    return {
      geoJsonDataRef: ref<{ geoJsonData: unknown; geoJsonStyle: unknown }>({
        geoJsonData: {},
        geoJsonStyle: {},
      }),
      geoadminToMapLibreStyleMock: vi.fn(),
      isMapLibreStyleMock: vi.fn(),
    };
  });

vi.mock("@swissgeo/ogc", () => ({
  useGeoJson: vi.fn(() => ({ geoJsonData: geoJsonDataRef })),
}));

vi.mock("@swissgeo/map", () => ({
  geoadminToMapLibreStyle: geoadminToMapLibreStyleMock,
  isMapLibreStyle: isMapLibreStyleMock,
}));

vi.mock("@swissgeo/coordinates", () => ({
  LV95: { getZoomForResolution: vi.fn((resolution: number) => resolution) },
}));

const FEATURES = { type: "FeatureCollection", features: [] };

function mountConverter() {
  return mount(GeoJsonConverter, {
    shallow: true,
    propsData: { distribution: null, layerId: "ch.demo.layer" },
  });
}

describe("GeoJsonConverter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geoJsonDataRef.value = { geoJsonData: {}, geoJsonStyle: {} };
  });

  it("converts a legacy geoadmin literals style to a MapLibre style", async () => {
    isMapLibreStyleMock.mockReturnValue(false);
    geoadminToMapLibreStyleMock.mockReturnValue({
      style: { version: 8, sources: {}, layers: [] },
      icons: [{ name: "triangle" }],
    });
    geoJsonDataRef.value = {
      geoJsonData: FEATURES,
      geoJsonStyle: { type: "unique", property: "symbol", values: [] },
    };

    const wrapper = mountConverter();
    await flushPromises();

    expect(geoadminToMapLibreStyleMock).toHaveBeenCalledOnce();
    // called with (style, sourceId, { resolutionToZoom })
    const [, sourceId, options] = geoadminToMapLibreStyleMock.mock.calls[0]!;
    expect(sourceId).toBe("ch.demo.layer");
    expect(typeof options.resolutionToZoom).toBe("function");

    const emitted = wrapper.emitted("updateData");
    expect(emitted).toHaveLength(1);
    expect(emitted![0]).toEqual([
      1,
      {
        geoJsonData: FEATURES,
        mapLibreStyle: { version: 8, sources: {}, layers: [] },
        mapLibreIcons: [{ name: "triangle" }],
      },
    ]);
  });

  it("passes an already-standard MapLibre style straight through", async () => {
    const mapLibreStyle = { version: 8, sources: { s: {} }, layers: [] };
    isMapLibreStyleMock.mockReturnValue(true);
    geoJsonDataRef.value = {
      geoJsonData: FEATURES,
      geoJsonStyle: mapLibreStyle,
    };

    const wrapper = mountConverter();
    await flushPromises();

    expect(geoadminToMapLibreStyleMock).not.toHaveBeenCalled();
    expect(wrapper.emitted("updateData")![0]).toEqual([
      1,
      { geoJsonData: FEATURES, mapLibreStyle },
    ]);
  });

  it("emits only the features when there is no style", async () => {
    geoJsonDataRef.value = { geoJsonData: FEATURES, geoJsonStyle: {} };

    const wrapper = mountConverter();
    await flushPromises();

    expect(geoadminToMapLibreStyleMock).not.toHaveBeenCalled();
    expect(wrapper.emitted("updateData")![0]).toEqual([
      1,
      { geoJsonData: FEATURES },
    ]);
  });

  it("does not emit before any data is fetched", async () => {
    const wrapper = mountConverter();
    await flushPromises();

    expect(wrapper.emitted("updateData")).toBeUndefined();
  });
});
