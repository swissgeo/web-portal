import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { GPXLayer } from "@/types";

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
  LogPreDefinedColor: { Fuchsia: "fuchsia" },
}));

vi.mock("@swissgeo/shared", () => ({
  EPSG_4326_WGS84: "EPSG:4326",
}));

const { MockGPX, mockReadFeatures } = vi.hoisted(() => {
  const mockReadFeatures = vi.fn(() => []);
  class MockGPX {
    readFeatures = mockReadFeatures;
  }
  return { MockGPX, mockReadFeatures };
});

vi.mock("ol/format/GPX", () => ({
  default: MockGPX,
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

vi.mock("ol/style", () => ({
  Circle: vi.fn(),
  Fill: vi.fn(),
  Stroke: vi.fn(),
  Style: vi.fn(function MockStyle(config: unknown) {
    return config;
  }),
}));

import useOlGPXLayer from "../olGPXLayer.composable";

function makeGPXLayer(overrides: Partial<GPXLayer> = {}): GPXLayer {
  return {
    format: "GPX",
    layerId: "test-gpx",
    uuid: "uuid-gpx",
    opacity: 1,
    isVisible: true,
    zIndex: 5,
    data: "<gpx></gpx>",
    ...overrides,
  };
}

describe("useOlGPXLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
  });

  it("creates a VectorLayer and initializes with GPX data", async () => {
    const layer = ref(makeGPXLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGPXLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalledWith(
      "<gpx></gpx>",
      expect.objectContaining({
        featureProjection: "EPSG:2056",
        dataProjection: "EPSG:4326",
      }),
    );

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("applies default blue styling", async () => {
    const { Style } = await import("ol/style");
    const layer = ref(makeGPXLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGPXLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(Style).toHaveBeenCalledWith(
      expect.objectContaining({
        stroke: expect.anything(),
        fill: expect.anything(),
        image: expect.anything(),
      }),
    );
  });

  it("uses layerId as computed from layer.layerId", async () => {
    const layer = ref(makeGPXLayer({ layerId: "ch.custom.layer" }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlGPXLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).toHaveBeenCalled();
  });
});
