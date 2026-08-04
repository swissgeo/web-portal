import type { FeatureCollection, Point } from "geojson";

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { GeoJSONLayer } from "@/types";

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

const { MockGeoJSON, mockReadFeatures } = vi.hoisted(() => {
  const mockReadFeatures = vi.fn((_data: unknown) => []);
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
    mockReadFeatures.mockClear();
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
      expect.objectContaining({ type: "FeatureCollection" }),
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

  function makePoint(coordinates: number[]) {
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Point" as const, coordinates },
    };
  }

  function mountWith(geoJsonData: GeoJSONLayer["geoJsonData"]) {
    const layer = ref(makeGeoJSONLayer({ geoJsonData }));
    const olMap = ref(undefined);

    mount(
      defineComponent({
        setup() {
          useOlLocalGeoJSONLayer(layer, olMap);
        },
        template: "<div />",
      }),
    );
    return nextTick();
  }

  function firstReadCoordinates(): number[] {
    const collection = mockReadFeatures.mock.calls[0]![0] as FeatureCollection;
    return (collection.features[0]!.geometry as Point).coordinates;
  }

  it("reprojects WGS84 data to the map projection when no crs is given", async () => {
    await mountWith({
      type: "FeatureCollection",
      features: [makePoint([7.4474, 46.9481])],
    });

    const [east, north] = firstReadCoordinates();
    expect(east).toBeCloseTo(2600667, -1);
    expect(north).toBeCloseTo(1199668, -1);
  });

  it("honours the obsolete crs property and skips reprojection when it already matches", async () => {
    const coordinates = [2600000, 1200000];
    await mountWith({
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:2056" } },
      features: [makePoint(coordinates)],
    });

    expect(firstReadCoordinates()).toEqual(coordinates);
  });
});
