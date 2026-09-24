import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { COGLayer } from "@/types";

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

const { MockGeoTIFFSource, mockConstructorSpy } = vi.hoisted(() => {
  const mockConstructorSpy = vi.fn(function MockGeoTIFFSource(config: unknown) {
    return { ...(config as Record<string, unknown>) };
  });
  return { MockGeoTIFFSource: mockConstructorSpy, mockConstructorSpy };
});

vi.mock("ol/source/GeoTIFF", () => ({
  default: MockGeoTIFFSource,
}));

vi.mock("ol/layer/WebGLTile", () => ({
  default: vi.fn(function MockWebGLTileLayer(config: Record<string, unknown>) {
    return {
      ...config,
      setVisible: vi.fn(),
      setZIndex: vi.fn(),
      setOpacity: vi.fn(),
      getSource: vi.fn(),
    };
  }),
}));

import useOlCOGLayer from "../olCOGLayer.composable";

function makeCOGLayer(overrides: Partial<COGLayer> = {}): COGLayer {
  return {
    format: "COG",
    layerId: "test-cog",
    uuid: "uuid-cog",
    opacity: 1,
    isVisible: true,
    zIndex: 5,
    ...overrides,
  };
}

describe("useOlCOGLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
    mockConstructorSpy.mockClear();
  });

  it("creates a WebGLTileLayer with URL source", async () => {
    const layer = ref(makeCOGLayer({ url: "https://example.com/data.tif" }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlCOGLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockConstructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sources: [{ url: "https://example.com/data.tif" }],
        convertToRGB: "auto",
      }),
    );
    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("creates a WebGLTileLayer with blob source", async () => {
    const blob = new File(["data"], "test.tif", { type: "image/tiff" });
    const layer = ref(makeCOGLayer({ blob }));
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlCOGLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockConstructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sources: [{ blob }],
        convertToRGB: "auto",
      }),
    );
  });

  it("does nothing when neither url nor blob is provided", async () => {
    const layer = ref(makeCOGLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlCOGLayer(layer, olMap);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockConstructorSpy).not.toHaveBeenCalled();
  });
});
