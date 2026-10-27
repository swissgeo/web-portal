import type { Ref } from "vue";

import { constants } from "@swissgeo/coordinates";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { GeoJSONLayer } from "@/types";

import {
  clearAddLayerToMapMocks,
  mockPositionStore,
  useAddLayerToMapSpy,
} from "./__mocks__/composables";

const { LV95_RESOLUTIONS } = constants;

vi.mock("@/composables/useAddLayerToMap.composable", () => ({
  default: useAddLayerToMapSpy,
}));
vi.mock("@/stores/position", () => ({
  default: vi.fn(() => mockPositionStore),
}));
vi.mock("@swissgeo/log", () => ({
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  LogPreDefinedColor: new Proxy({}, { get: (_t, p) => String(p) }),
}));

vi.mock("ol/proj/proj4", () => ({
  register: vi.fn(),
}));

vi.mock("proj4", () => ({
  // `@swissgeo/coordinates` calls proj4.defs(...) at import time
  // (registerProj4), so the mock needs the method to exist.
  default: Object.assign(vi.fn(), { defs: vi.fn() }),
}));

const { stylefunctionMock } = vi.hoisted(() => ({
  stylefunctionMock: vi.fn(),
}));

vi.mock("ol-mapbox-style", () => ({
  stylefunction: stylefunctionMock,
}));

vi.mock("@/utils/textBackgroundHelper", () => ({
  applyOlTextBackground: vi.fn(),
}));

const { MockGeoJSON, mockReadFeatures } = vi.hoisted(() => {
  const mockReadFeatures = vi.fn(() => []);
  class MockGeoJSON {
    readFeatures = mockReadFeatures;
  }
  return { MockGeoJSON, mockReadFeatures };
});

vi.mock("ol/format/GeoJSON", () => ({
  default: MockGeoJSON,
}));

vi.mock("ol/layer/Vector", () => ({
  default: vi.fn(function MockVectorLayer(config: Record<string, unknown>) {
    return {
      ...config,
      setStyle: vi.fn(),
      setSource: vi.fn(),
      getSource: vi.fn(),
      setVisible: vi.fn(),
      setZIndex: vi.fn(),
      setOpacity: vi.fn(),
    };
  }),
}));

vi.mock("ol/source/Vector", () => ({
  default: vi.fn(function MockVectorSource(config: Record<string, unknown>) {
    return { ...config };
  }),
}));

vi.mock("@/utils/geoJsonUtils", () => ({
  reprojectGeoJsonData: vi.fn((_data: unknown, _proj: unknown) => ({
    type: "FeatureCollection",
    features: [],
  })),
}));

import useOlGeoJSONLayer from "../olGeoJSONLayer.composable";

function makeGeoJSONLayer(overrides: Partial<GeoJSONLayer> = {}): GeoJSONLayer {
  return {
    format: "GeoJSON",
    layerId: "test-geojson",
    uuid: "uuid-geojson",
    opacity: 1,
    isVisible: true,
    zIndex: 5,
    geoJsonData: {
      type: "FeatureCollection",
      features: [],
    },
    ...overrides,
  };
}

describe("useOlGeoJSONLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
  });
  it("creates a VectorLayer and initializes with GeoJSON data", async () => {
    const layer: Ref<GeoJSONLayer> = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalled();
    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("applies the MapLibre style via ol-mapbox-style when provided", async () => {
    const mapLibreStyle: GeoJSONLayer["mapLibreStyle"] = {
      version: 8,
      sources: {
        "test-geojson": {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      layers: [],
    };
    const layer: Ref<GeoJSONLayer> = ref(
      makeGeoJSONLayer({
        mapLibreStyle,
        mapLibreIcons: [
          {
            name: "sg-triangle-12-#808080-#FFFFFF-1",
            shape: "triangle",
            radius: 12,
          },
        ],
      }),
    );
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(stylefunctionMock).toHaveBeenCalledTimes(1);
    const [olLayer, style, sourceId, resolutions, , , , getImage] =
      stylefunctionMock.mock.calls[0]!;
    // layer.value wraps the style in a reactive proxy, so compare deeply
    expect(style).toStrictEqual(mapLibreStyle);
    expect(sourceId).toBe("test-geojson");
    expect(resolutions).toEqual(LV95_RESOLUTIONS);
    expect(typeof getImage).toBe("function");
    const { applyOlTextBackground } =
      await import("@/utils/textBackgroundHelper");
    expect(applyOlTextBackground).toHaveBeenCalledWith(olLayer, mapLibreStyle);
  });

  it("falls back to the default style without any style", async () => {
    const layer: Ref<GeoJSONLayer> = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(stylefunctionMock).not.toHaveBeenCalled();
  });

  it("calls reprojectGeoJsonData with correct projection", async () => {
    const { reprojectGeoJsonData } = await import("@/utils/geoJsonUtils");
    const layer: Ref<GeoJSONLayer> = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(reprojectGeoJsonData).toHaveBeenCalledWith(
      expect.anything(),
      mockPositionStore.projection,
    );
  });

  it("registers proj4 on initialize", async () => {
    const { register } = await import("ol/proj/proj4");
    const layer: Ref<GeoJSONLayer> = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(register).toHaveBeenCalled();
  });

  it("does not initialize until the GeoJSON data arrives", async () => {
    const layer: Ref<GeoJSONLayer> = ref(
      makeGeoJSONLayer({
        geoJsonData: undefined as unknown as GeoJSONLayer["geoJsonData"],
      }),
    );
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).not.toHaveBeenCalled();

    layer.value.geoJsonData = { type: "FeatureCollection", features: [] };
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalled();
    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });
});
