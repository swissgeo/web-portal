import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { GeoJSONLayer } from "@/types";

import {
  clearAddLayerToMapMocks,
  useAddLayerToMapSpy,
  mockPositionStore,
} from "./__mocks__/composables";

vi.mock("@/composables/useAddLayerToMap.composable", () => ({
  default: useAddLayerToMapSpy,
}));

vi.mock("@/stores/position", () => ({
  default: vi.fn(() => mockPositionStore),
}));

vi.mock("@swissgeo/log", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  LogPreDefinedColor: { Yellow: "yellow" },
}));

vi.mock("ol/proj/proj4", () => ({
  register: vi.fn(),
}));

vi.mock("proj4", () => ({
  default: vi.fn(),
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

vi.mock("ol/Feature", () => ({
  Feature: vi.fn(function MockFeature(geometry?: unknown) {
    return { getProperties: () => ({}), getGeometry: () => geometry };
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
});
