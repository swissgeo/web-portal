import { describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import type { WMSLayer } from "@/types/layers";

import useOlWmsLayer from "@/composables/olWMSLayer.composable";

const { updateParamsSpy, MockTileWMS, MockImageWMS } = vi.hoisted(() => {
  const spy = vi.fn();

  class HoistedMockTileWMS {
    updateParams = spy;

    constructor(_config: unknown) {}
  }

  class HoistedMockImageWMS {
    updateParams = spy;

    constructor(_config: unknown) {}
  }

  return {
    updateParamsSpy: spy,
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

describe("useOlWmsLayer LANG propagation", () => {
  it("updates source params with new LANG when layer lang changes", async () => {
    updateParamsSpy.mockClear();

    const layer = ref<WMSLayer>({
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
    });

    useOlWmsLayer(layer, ref(undefined));
    await nextTick();

    layer.value.lang = "fr";
    await nextTick();

    const latestParams = updateParamsSpy.mock.calls.at(-1)?.[0];
    expect(latestParams).toMatchObject({ LANG: "fr" });
  });
});
