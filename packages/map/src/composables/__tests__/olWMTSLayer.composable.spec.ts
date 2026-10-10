import type { Ref } from "vue";

import { mount } from "@vue/test-utils";
import WMTSTileGrid from "ol/tilegrid/WMTS";
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
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  LogPreDefinedColor: new Proxy({}, { get: (_t, p) => String(p) }),
}));

const { MockWMTS, updateDimensionsSpy, wmtsConfigs, mapStoreState } =
  vi.hoisted(() => {
    const spy = vi.fn();
    const configs: Record<string, unknown>[] = [];

    class HoistedMockWMTS {
      updateDimensions = spy;

      constructor(config: Record<string, unknown>) {
        configs.push(config);
      }
    }

    return {
      MockWMTS: HoistedMockWMTS,
      updateDimensionsSpy: spy,
      wmtsConfigs: configs,
      mapStoreState: { pinnedTileResolution: null as number | null },
    };
  });

vi.mock("@/stores/map", () => ({
  useMapStore: () => mapStoreState,
}));

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
    wmtsConfigs.length = 0;
    mapStoreState.pinnedTileResolution = null;
  });

  function mountLayer(layer: Ref<WMTSLayer>) {
    mount(
      defineComponent({
        setup() {
          useOlWmtsLayer(layer, ref(undefined));
        },
        template: "<div />",
      }),
    );
  }

  const tileGrid = () =>
    new WMTSTileGrid({
      origin: [2420000, 1350000],
      resolutions: [5, 2.5, 1],
      matrixIds: ["21", "22", "25"],
      sizes: [
        [375, 250],
        [750, 500],
        [1875, 1250],
      ],
      tileSize: 256,
    });

  it("requests the tile level of the pinned resolution, whatever the view resolution", async () => {
    mapStoreState.pinnedTileResolution = 2.5;
    mountLayer(
      ref(
        makeWMTSLayer({
          options: { layer: "ch.test.wmts", tileGrid: tileGrid() } as never,
        }),
      ) as Ref<WMTSLayer>,
    );
    await nextTick();

    const pinned = (wmtsConfigs[0] as { tileGrid: WMTSTileGrid }).tileGrid;
    expect(pinned.getResolutions()).toEqual([2.5]);
    expect(pinned.getMatrixId(0)).toBe("22");
  });

  it("keeps the whole tile grid when nothing is pinned", async () => {
    mountLayer(
      ref(
        makeWMTSLayer({
          options: { layer: "ch.test.wmts", tileGrid: tileGrid() } as never,
        }),
      ) as Ref<WMTSLayer>,
    );
    await nextTick();

    const grid = (wmtsConfigs[0] as { tileGrid: WMTSTileGrid }).tileGrid;
    expect(grid.getResolutions()).toEqual([5, 2.5, 1]);
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
