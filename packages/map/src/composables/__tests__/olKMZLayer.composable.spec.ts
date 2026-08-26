import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { KMZLayer } from "@/types";

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
vi.mock("@swissgeo/shared", () => ({
  createDrawingFeatureStyleFunction: vi.fn((style: unknown) => style),
  createTextFeatureStyle: vi.fn(() => ({})),
  EPSG_4326_WGS84: "EPSG:4326",
  isDrawingFeature: vi.fn(() => false),
  parseBoolean: vi.fn((val: unknown) => val === "true" || val === true),
}));

vi.mock("fflate", () => ({
  unzip: vi.fn(
    (
      _data: Uint8Array,
      callback: (
        _err: Error | null,
        _result: Record<string, Uint8Array>,
      ) => void,
    ) => {
      callback(null, {
        "doc.kml": new TextEncoder().encode("<kml></kml>"),
      });
    },
  ),
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
  default: vi.fn(function MockVectorLayer(_config: Record<string, unknown>) {
    return {
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

import useOlKMZLayer from "../olKMZLayer.composable";

const onError = vi.fn();

function makeKMZLayer(overrides: Partial<KMZLayer> = {}): KMZLayer {
  // Simple binary placeholder; unzip is mocked in these tests.
  return {
    format: "KMZ",
    layerId: "test-kmz",
    uuid: "uuid-kmz",
    opacity: 1,
    isVisible: true,
    zIndex: 5,
    data: new TextEncoder().encode("PK"),
    ...overrides,
  };
}

describe("useOlKMZLayer", () => {
  beforeEach(() => {
    clearAddLayerToMapMocks();
    mockReadFeatures.mockClear();
    onError.mockClear();
  });
  it("creates a VectorLayer and calls addLayerToMap", async () => {
    const layer = ref(makeKMZLayer());
    const olMap = ref(undefined);

    const TestComponent = defineComponent({
      setup() {
        useOlKMZLayer(layer, olMap, onError);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(useAddLayerToMapSpy).toHaveBeenCalled();
  });

  it("unzips KMZ and parses KML features", async () => {
    const { unzip } = await import("fflate");
    const layer = ref(makeKMZLayer());

    const TestComponent = defineComponent({
      setup() {
        useOlKMZLayer(layer, ref(undefined), onError);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(unzip).toHaveBeenCalled();
  });

  it("registers proj4", async () => {
    const { register } = await import("ol/proj/proj4");
    const layer = ref(makeKMZLayer());

    const TestComponent = defineComponent({
      setup() {
        useOlKMZLayer(layer, ref(undefined), onError);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(register).toHaveBeenCalled();
  });

  it("replaces icon references with blob URLs", async () => {
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
    createObjectURLSpy.mockReturnValue("blob:http://localhost/fake-url");

    const mockKmlContent =
      "<kml><Placemark><styleUrl>icons/test.png</styleUrl></Placemark></kml>";
    const { unzip } = await import("fflate");
    vi.mocked(unzip).mockImplementationOnce(((
      _data: Uint8Array,
      callback: (..._args: never[]) => void,
    ) => {
      (callback as (_err: null, _result: Record<string, Uint8Array>) => void)(
        null,
        {
          "doc.kml": new TextEncoder().encode(mockKmlContent),
          "icons/test.png": new Uint8Array([1, 2, 3]),
        },
      );
    }) as never);

    const layer = ref(makeKMZLayer());

    const TestComponent = defineComponent({
      setup() {
        useOlKMZLayer(layer, ref(undefined), onError);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(createObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
  });

  it("rejects KMZ exceeding decompression limit", async () => {
    const { unzip } = await import("fflate");
    const maxBytes = 1 * 1024 * 1024;
    const oversized = "<kml>" + "x".repeat(maxBytes + 1) + "</kml>";
    vi.mocked(unzip).mockImplementationOnce(((
      _data: Uint8Array,
      callback: (..._args: never[]) => void,
    ) => {
      (callback as (_err: null, _result: Record<string, Uint8Array>) => void)(
        null,
        {
          "doc.kml": new TextEncoder().encode(oversized),
        },
      );
    }) as never);

    const layer = ref(makeKMZLayer());
    const TestComponent = defineComponent({
      setup() {
        useOlKMZLayer(layer, ref(undefined), onError, 1);
      },
      template: "<div />",
    });

    mount(TestComponent);
    await nextTick();

    expect(mockReadFeatures).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("KMZ archive too large"),
      }),
    );
  });
});
