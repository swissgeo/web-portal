import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { GeoJSONLayer } from "@/types";
import type { MapLibreStyle } from "@/utils/geoadminToMapLibreStyle";

import {
  clearAddLayerToMapMocks,
  mockPositionStore,
  useAddLayerToMapSpy,
} from "./__mocks__/composables";

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

vi.mock("proj4", () => {
  const proj4Mock = Object.assign(vi.fn(), { defs: vi.fn() });
  return { default: proj4Mock };
});

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

vi.mock("../../utils/geoJsonStyleFromLiterals", () => ({
  default: vi.fn(function MockOlStyleForPropertyValue() {
    return {
      getFeatureStyle: vi.fn(() => ({})),
      defaultStyle: {},
    };
  }),
}));

const { applyOlTextBackgroundMock, makeGetImageMock, stylefunctionMock } =
  vi.hoisted(() => ({
    applyOlTextBackgroundMock: vi.fn(),
    makeGetImageMock: vi.fn(() => vi.fn()),
    stylefunctionMock: vi.fn(),
  }));

vi.mock("ol-mapbox-style", () => ({
  stylefunction: stylefunctionMock,
}));

vi.mock("@/utils/maplibreShapeIcons", () => ({
  makeGetImage: makeGetImageMock,
}));

vi.mock("@/utils/textBackgroundHelper", () => ({
  applyOlTextBackground: applyOlTextBackgroundMock,
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
    stylefunctionMock.mockClear();
    makeGetImageMock.mockClear();
    applyOlTextBackgroundMock.mockClear();
  });
  it("creates a VectorLayer and initializes with GeoJSON data", async () => {
    const layer = ref(makeGeoJSONLayer());
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

  it("sets style function when geoJsonStyle is provided", async () => {
    const layer = ref(
      makeGeoJSONLayer({
        geoJsonStyle: {
          type: "unique",
          property: "status",
          values: [],
        },
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

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("calls reprojectGeoJsonData with correct projection", async () => {
    const { reprojectGeoJsonData } = await import("@/utils/geoJsonUtils");
    const layer = ref(makeGeoJSONLayer());
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
    const layer = ref(makeGeoJSONLayer());
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

  it("applies a MapLibre style via ol-mapbox-style when mapLibreStyle is set", async () => {
    const mapLibreStyle: MapLibreStyle = {
      version: 8,
      sources: { "test-geojson": { type: "geojson", data: {} } },
      layers: [],
    };
    const layer = ref(
      makeGeoJSONLayer({
        mapLibreStyle,
        mapLibreIcons: [{ name: "icon", shape: "circle", radius: 5 }],
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

    expect(makeGetImageMock).toHaveBeenCalledWith(layer.value.mapLibreIcons);
    expect(stylefunctionMock).toHaveBeenCalledWith(
      expect.anything(),
      mapLibreStyle,
      "test-geojson",
      expect.anything(),
      undefined,
      undefined,
      undefined,
      expect.any(Function),
    );
    expect(applyOlTextBackgroundMock).toHaveBeenCalledWith(
      expect.anything(),
      mapLibreStyle,
    );
  });

  it("logs an error and skips styling when the MapLibre style has no source", async () => {
    const { default: log } = await import("@swissgeo/log");
    const mapLibreStyle: MapLibreStyle = {
      version: 8,
      sources: {},
      layers: [],
    };
    const layer = ref(makeGeoJSONLayer({ mapLibreStyle }));
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
    expect(log.error).toHaveBeenCalled();
  });

  it("leaves the layer without a source when geoJsonData is empty", async () => {
    mockReadFeatures.mockClear();
    const layer = ref(
      makeGeoJSONLayer({
        geoJsonData: {} as GeoJSONLayer["geoJsonData"],
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
  });
});
