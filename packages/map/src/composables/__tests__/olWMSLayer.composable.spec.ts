import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import type { WMSLayer } from "@/types/layers";

import useOlWmsLayer from "@/composables/olWMSLayer.composable";

const { tileUpdateParamsSpy, imageUpdateParamsSpy, MockTileWMS, MockImageWMS } =
  vi.hoisted(() => {
    const tileSpy = vi.fn();
    const imageSpy = vi.fn();

    class HoistedMockTileWMS {
      updateParams = tileSpy;

      constructor(_config: unknown) {}
    }

    class HoistedMockImageWMS {
      updateParams = imageSpy;

      constructor(_config: unknown) {}
    }

    return {
      tileUpdateParamsSpy: tileSpy,
      imageUpdateParamsSpy: imageSpy,
      MockTileWMS: HoistedMockTileWMS,
      MockImageWMS: HoistedMockImageWMS,
    };
  });

vi.mock("ol/source", () => ({
  TileWMS: MockTileWMS,
  ImageWMS: MockImageWMS,
}));

vi.mock("ol/layer/Tile", () => ({
  default: class MockTileLayer {
    constructor(_config: unknown) {}
  },
}));

vi.mock("ol/layer/Image", () => ({
  default: class MockImageLayer {
    constructor(_config: unknown) {}
  },
}));

vi.mock("ol/tilegrid", () => ({
  TileGrid: class MockTileGrid {
    constructor(_config: unknown) {}
  },
}));

vi.mock("@/composables/useAddLayerToMap.composable", () => ({
  default: vi.fn(() => ({
    addLayerToMap: vi.fn(),
  })),
}));

vi.mock("@/stores/position", () => ({
  default: vi.fn(() => ({
    projection: {
      epsg: "EPSG:2056",
      usesMercatorPyramid: true,
      getResolutionSteps: (): number[] => [],
      bounds: { flatten: [0, 0, 0, 0] },
      getTileOrigin: () => [0, 0],
    },
  })),
}));

vi.mock("@swissgeo/log", () => ({
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  LogPreDefinedColor: new Proxy({}, { get: (_t, p) => String(p) }),
}));
vi.mock("@swissgeo/timeslider", () => ({
  ALL_YEARS_TIMESTAMP: "9999",
}));

function makeWMSLayer(overrides: Partial<WMSLayer> = {}): WMSLayer {
  return {
    format: "WMS",
    layerId: "ch.test.layer",
    uuid: "uuid-1",
    opacity: 1,
    isVisible: true,
    zIndex: 1,
    dimensions: {},
    gutter: 0,
    url: "https://example.test/wms",
    version: "1.3.0",
    lang: "de",
    ...overrides,
  };
}

describe("useOlWmsLayer", () => {
  beforeEach(() => {
    tileUpdateParamsSpy.mockClear();
    imageUpdateParamsSpy.mockClear();
  });

  it("updates source params with new LANG when layer lang changes", async () => {
    const layer = ref(makeWMSLayer());

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    layer.value.lang = "fr";
    await nextTick();

    const latestParams = tileUpdateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams).toMatchObject({ LANG: "fr" });
  });

  it("creates TileWMS source when gutter is not -1", async () => {
    const layer = ref(makeWMSLayer({ gutter: 512 }));

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    // Trigger lang change to invoke updateParams on the source
    layer.value.lang = "en";
    await nextTick();

    expect(tileUpdateParamsSpy).toHaveBeenCalled();
  });

  it("creates ImageWMS source when gutter is -1", async () => {
    const layer = ref(makeWMSLayer({ gutter: -1 }));

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    // Trigger lang change to invoke updateParams on the source
    layer.value.lang = "en";
    await nextTick();

    expect(imageUpdateParamsSpy).toHaveBeenCalled();
  });

  it("creates TileWMS layer with correct URL params", async () => {
    const layer = ref(makeWMSLayer());

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    // Trigger lang change to capture the params
    layer.value.lang = "en";
    await nextTick();

    const latestParams = tileUpdateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams).toMatchObject({
      TRANSPARENT: true,
      LAYERS: "ch.test.layer",
      FORMAT: "image/png",
      LANG: "en",
      VERSION: "1.3.0",
      CRS: "EPSG:2056",
    });
  });

  it("sets TIME param from dimension.currentValue", async () => {
    const layer = ref(
      makeWMSLayer({
        dimensions: {
          time: {
            currentValue: "2023-01-01",
            availableValues: ["2023-01-01", "2023-06-01"],
          },
        },
      }),
    );

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    // Trigger lang change to capture params with TIME
    layer.value.lang = "en";
    await nextTick();

    const latestParams = tileUpdateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams).toMatchObject({ TIME: "2023-01-01" });
  });

  it("sets TIME to undefined for ALL_YEARS_TIMESTAMP", async () => {
    const layer = ref(
      makeWMSLayer({
        dimensions: {
          time: {
            currentValue: "9999",
            availableValues: ["9999"],
          },
        },
      }),
    );

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    layer.value.lang = "en";
    await nextTick();

    const latestParams = tileUpdateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams.TIME).toBeUndefined();
  });

  it("defaults to 'current' when no time dimension is set", async () => {
    const layer = ref(makeWMSLayer({ dimensions: {} }));

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    layer.value.lang = "en";
    await nextTick();

    const latestParams = tileUpdateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams).toBeDefined();
    expect(latestParams.TIME).toBe("current");
  });

  it("updates time dimension when currentValue changes", async () => {
    const layer = ref(
      makeWMSLayer({
        dimensions: {
          time: {
            currentValue: "2023-01-01",
            availableValues: ["2023-01-01", "2023-06-01"],
          },
        },
      }),
    );

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    tileUpdateParamsSpy.mockClear();

    layer.value = makeWMSLayer({
      dimensions: {
        time: {
          currentValue: "2023-06-01",
          availableValues: ["2023-01-01", "2023-06-01"],
        },
      },
    });
    await nextTick();

    const latestParams = tileUpdateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams).toMatchObject({ TIME: "2023-06-01" });
  });
});
