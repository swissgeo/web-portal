import type { Ref } from "vue";

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { WMTSLayer } from "@/types/layers";

import {
  clearAddLayerToMapMocks,
  useAddLayerToMapSpy,
} from "./__mocks__/composables";

vi.mock("@/composables/useAddLayerToMap.composable", () => ({
  default: useAddLayerToMapSpy,
}));

vi.mock("@swissgeo/log", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  LogPreDefinedColor: { Green: "green" },
}));

const { MockWMTS, updateDimensionsSpy } = vi.hoisted(() => {
  const spy = vi.fn();

  class HoistedMockWMTS {
    updateDimensions = spy;

    constructor(_config: unknown) {}
  }

  return { MockWMTS: HoistedMockWMTS, updateDimensionsSpy: spy };
});

vi.mock("ol/source/WMTS", () => ({
  default: MockWMTS,
}));

vi.mock("ol/layer", () => ({
  Tile: vi.fn(function MockTileLayer(config: Record<string, unknown>) {
    return {
      ...config,
      setSource: vi.fn(),
      setVisible: vi.fn(),
      setZIndex: vi.fn(),
      setOpacity: vi.fn(),
    };
  }),
}));

import useOlWmtsLayer from "../olWMTSLayer.composable";

function makeWMTSLayer(overrides: Partial<WMTSLayer> = {}): WMTSLayer {
  return {
    format: "WMTS",
    layerId: "test-wmts",
    uuid: "uuid-wmts",
    opacity: 1,
    isVisible: true,
    zIndex: 1,
    dimensions: {},
    options: {
      layer: "ch.test.wmts",
      matrixSet: "EPSG:2056",
      url: "https://example.test/wmts",
    } as never,
    ...overrides,
  } as WMTSLayer;
}

describe("useOlWmtsLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
  });
  it("creates a TileLayer and WMTS source when options are provided", async () => {
    const layer = ref(makeWMTSLayer()) as Ref<WMTSLayer>;
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlWmtsLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("does not create a source when options are null", async () => {
    const layer = ref(
      makeWMTSLayer({ options: null as never }),
    ) as Ref<WMTSLayer>;
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlWmtsLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("updates time dimension when currentValue changes", async () => {
    const layer = ref(
      makeWMTSLayer({
        dimensions: {
          time: {
            currentValue: "2023-01-01",
            availableValues: ["2023-01-01", "2023-06-01"],
          },
        },
      }),
    ) as Ref<WMTSLayer>;
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlWmtsLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    layer.value = makeWMTSLayer({
      dimensions: {
        time: {
          currentValue: "2023-06-01",
          availableValues: ["2023-01-01", "2023-06-01"],
        },
      },
    });
    await nextTick();

    expect(updateDimensionsSpy).toHaveBeenCalledWith({
      Time: "2023-06-01",
    });
  });

  it("uses 'current' as default timestamp", async () => {
    const layer = ref(makeWMTSLayer()) as Ref<WMTSLayer>;
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlWmtsLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });
});
