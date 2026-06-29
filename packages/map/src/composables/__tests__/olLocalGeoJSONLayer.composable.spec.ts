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
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  LogPreDefinedColor: { Rose: "rose" },
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
      setSource: vi.fn(),
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

vi.mock("ol/style", () => ({
  Circle: vi.fn(),
  Fill: vi.fn(),
  Stroke: vi.fn(),
  Style: vi.fn(function MockStyle(config: unknown) {
    return config;
  }),
}));

import useOlLocalGeoJSONLayer from "../olLocalGeoJSONLayer.composable";

function makeGeoJSONLayer(overrides: Partial<GeoJSONLayer> = {}): GeoJSONLayer {
  return {
    format: "GeoJSON",
    layerId: "test-local-geojson",
    uuid: "uuid-local-geojson",
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

describe("useOlLocalGeoJSONLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
  });
  it("creates a VectorLayer with red styling and initializes", async () => {
    const layer = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlLocalGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:2056",
      }),
    );
    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("applies hardcoded red style", async () => {
    const { Style } = await import("ol/style");
    const layer = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlLocalGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(Style).toHaveBeenCalledWith(
      expect.objectContaining({
        fill: expect.anything(),
        stroke: expect.anything(),
        image: expect.anything(),
      }),
    );
  });

  it("returns early with error log when geoJsonData is falsy", async () => {
    const { error } = await import("@swissgeo/log").then((m) => m.default);
    const layer = ref(makeGeoJSONLayer({ geoJsonData: null as never }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlLocalGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(error).toHaveBeenCalled();
  });

  it("calls readFeatures with correct projection", async () => {
    const layer = ref(makeGeoJSONLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlLocalGeoJSONLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:2056",
      }),
    );
  });
});
