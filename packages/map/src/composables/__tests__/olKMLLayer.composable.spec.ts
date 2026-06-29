import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { KMLLayer } from "@/types";

import {
  clearAddLayerToMapMocks,
  mockAddLayerToMap,
  mockDrawingVectorLayer,
  mockPositionStore,
  useAddLayerToMapSpy,
} from "./__mocks__/composables";

vi.mock("@/composables/useAddLayerToMap.composable", () => ({
  default: useAddLayerToMapSpy,
}));

vi.mock("@/stores/position", () => ({
  default: vi.fn(() => mockPositionStore),
}));

vi.mock("@swissgeo/drawing", () => ({
  useDrawing: vi.fn(() => ({
    drawingVectorLayer: mockDrawingVectorLayer,
    DRAWING_LAYER_UUID: "drawing-layer-uuid",
  })),
}));

vi.mock("@swissgeo/log", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  LogPreDefinedColor: { Fuchsia: "fuchsia" },
}));

vi.mock("@swissgeo/shared", () => ({
  createDrawingFeatureStyleFunction: vi.fn((style: unknown) => style),
  createTextFeatureStyle: vi.fn(() => ({})),
  DRAWING_KML_LAYER_ID: "drawing-kml-layer-id",
  EPSG_4326_WGS84: "EPSG:4326",
  isDrawingFeature: vi.fn(() => false),
  parseBoolean: vi.fn((val: unknown) => val === "true" || val === true),
  resolveColoredSvgDataUrl: vi.fn((_src: string, color: string) => color),
  resolveStyleProps: vi.fn(() => ({})),
}));

vi.mock("ol/proj/proj4", () => ({
  register: vi.fn(),
}));

vi.mock("proj4", () => ({
  default: vi.fn(),
}));

const { MockKML, mockReadFeatures } = vi.hoisted(() => {
  const mockReadFeatures = vi.fn(() => []);
  class MockKML {
    readFeatures = mockReadFeatures;
    constructor(_config?: unknown) {}
  }
  return { MockKML, mockReadFeatures };
});

vi.mock("ol/format/KML", () => ({
  default: MockKML,
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
  Icon: vi.fn(function MockIcon(config: unknown) {
    return {
      ...(config as Record<string, unknown>),
      getSrc: vi.fn(),
      getScale: vi.fn(() => 1),
      getAnchor: vi.fn(() => [0, 0]),
      getRotation: vi.fn(() => 0),
      getRotateWithView: vi.fn(() => false),
    };
  }),
  Style: vi.fn(function MockStyle(config: unknown) {
    return config;
  }),
}));

import useOlKMLLayer from "../olKMLLayer.composable";

function makeKMLLayer(overrides: Partial<KMLLayer> = {}): KMLLayer {
  return {
    format: "KML",
    layerId: "test-kml",
    uuid: "uuid-kml",
    opacity: 1,
    isVisible: true,
    zIndex: 5,
    data: "<kml></kml>",
    ...overrides,
  };
}

describe("useOlKMLLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
  });
  it("creates a VectorLayer and initializes for non-drawing layer", async () => {
    const layer = ref(makeKMLLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlKMLLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalled();
    expect(mockAddLayerToMap).toHaveBeenCalled();
  });

  it("uses drawingVectorLayer for drawing layer", async () => {
    const layer = ref(makeKMLLayer({ uuid: "drawing-layer-uuid" }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlKMLLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    // Drawing layer should NOT call addLayerToMap
    expect(mockAddLayerToMap).not.toHaveBeenCalled();
  });

  it("registers proj4 on initialize", async () => {
    const { register } = await import("ol/proj/proj4");
    const layer = ref(makeKMLLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlKMLLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(register).toHaveBeenCalled();
  });

  it("sets opacity on layer when opacity changes", async () => {
    const layer = ref(makeKMLLayer({ opacity: 0.5 }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlKMLLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("unsets __isSelected for drawing KML layer features", async () => {
    const mockFeature = {
      unset: vi.fn(),
      get: vi.fn(),
      getGeometry: vi.fn(),
      getStyle: vi.fn(() => null),
      setStyle: vi.fn(),
      changed: vi.fn(),
      set: vi.fn(),
    };
    mockReadFeatures.mockReturnValueOnce([mockFeature]);

    const layer = ref(makeKMLLayer({ layerId: "drawing-kml-layer-id" }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlKMLLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockFeature.unset).toHaveBeenCalledWith("__isSelected", true);
  });
});
