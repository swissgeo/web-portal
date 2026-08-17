import type { MapClickEvent } from "@swissgeo/map";

import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent } from "vue";

import BaseMapViewer from "../BaseMapViewer.vue";

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

const DISTRIBUTION_URL = "https://example.test/distributions";

const mockLayers = [
  {
    uuid: "layer-1",
    layerId: "1",
    displayName: "Layer 1",
    opacity: 1,
    data: {
      id: "ch.test.dataset",
      links: [{ rel: "distributions", href: DISTRIBUTION_URL }],
    },
  },
];

const getMapLayers = vi.fn(() => computed(() => mockLayers));

mockNuxtImport("useMapViewStore", () => {
  return () => ({
    getMapLayers,
  });
});
vi.mock("@swissgeo/layers", () => {
  return {
    useLayerStore: () => ({
      layers: mockLayers,
      backgroundLayer: { uuid: "layer-1" },
    }),
  };
});

vi.mock("~/stores/mapView", () => ({
  useMapViewStore: () => ({
    getMapLayers,
  }),
}));

vi.mock("@swissgeo/feature", () => ({
  selectFeatures: vi.fn(),
}));

vi.mock("@swissgeo/map", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    usePositionStore: () => ({
      projection: { epsgNumber: 2056 },
    }),
  };
});

import { selectFeatures } from "@swissgeo/feature";

const selectFeaturesSpy = vi.mocked(selectFeatures);

// -----------------------------------------------------------------------------
// Stubs
// -----------------------------------------------------------------------------

const SourceToMapDataConverterStub = defineComponent({
  name: "SourceToMapDataConverter",
  props: ["sourceBgLayer", "sourceData"],
  template: "<div data-testid='converter' />",
});

const ToolboxStub = defineComponent({
  name: "Toolbox",
  template: "<div data-testid='toolbox' />",
});

const MapModuleStub = defineComponent({
  name: "MapModule",
  props: [
    "layers",
    "customLayerRenderers",
    "displayMode",
    "compareSliderActive",
    "compareRatio",
    "compareSliderClippedLayer",
    "zoomOnlyCtrl",
  ],
  emits: ["update:compare-ratio", "map-click"],
  template: '<div data-testid="map-module"><slot name="map-ui" /></div>',
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const fetchSpy = vi.fn();

function clickEvent(
  vectorFeaturesPerLayer: MapClickEvent["vectorFeaturesPerLayer"] = {},
): MapClickEvent {
  return {
    coordinate: [2600000, 1200000],
    pixel: [10, 10],
    extent: [2599000, 1199000, 2601000, 1201000],
    viewportSize: [800, 600],
    vectorFeaturesPerLayer,
  };
}

describe("BaseMapViewer — map click abort handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
  });

  async function createWrapper() {
    return await mountSuspended(BaseMapViewer, {
      global: {
        stubs: {
          ClientOnly: {
            template: "<div><slot /></div>",
          },
          MapModule: MapModuleStub,
          SourceToMapDataConverter: SourceToMapDataConverterStub,
          Toolbox: ToolboxStub,
        },
      },
    });
  }

  it("aborts the previous click's in-flight request and identifies only for the latest click", async () => {
    let resolveFirstFetch!: (_value: Response) => void;
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirstFetch = resolve;
        }),
    );
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

    const wrapper = await createWrapper();
    const mapModule = wrapper.getComponent(MapModuleStub);

    mapModule.vm.$emit("map-click", clickEvent());
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const firstSignal = fetchSpy.mock.calls[0]![1]!.signal as AbortSignal;
    expect(firstSignal.aborted).toBe(false);

    mapModule.vm.$emit("map-click", clickEvent());
    // the new click aborts the previous signal synchronously
    expect(firstSignal.aborted).toBe(true);

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    const secondSignal = fetchSpy.mock.calls[1]![1]!.signal as AbortSignal;
    expect(secondSignal).not.toBe(firstSignal);
    expect(secondSignal.aborted).toBe(false);

    await vi.waitFor(() => expect(selectFeaturesSpy).toHaveBeenCalledTimes(1));
    const [extent, epsgNumber, , sources, limit, signal] =
      selectFeaturesSpy.mock.calls[0]!;
    expect(extent).toEqual(clickEvent().extent);
    expect(epsgNumber).toBe(2056);
    expect(limit).toBe(10);
    expect(signal).toBe(secondSignal);
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      kind: "geoadmin",
      layerUuid: "layer-1",
      layerId: "ch.test.dataset",
    });

    // the aborted click's fetch resolves late: the signal.aborted guard must
    // prevent it from triggering a second (stale) identify
    resolveFirstFetch({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(selectFeaturesSpy).toHaveBeenCalledTimes(1);
  });

  it("threads the click's signal into the distributions fetch", async () => {
    fetchSpy.mockResolvedValue({ ok: false } as Response);

    const wrapper = await createWrapper();
    wrapper.getComponent(MapModuleStub).vm.$emit("map-click", clickEvent());

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const signal = fetchSpy.mock.calls[0]![1]!.signal as AbortSignal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
    expect(fetchSpy.mock.calls[0]![0]).toBe(DISTRIBUTION_URL);
  });

  it("swallows a rejecting distributions fetch (as a real aborted fetch would) and still identifies", async () => {
    fetchSpy.mockRejectedValueOnce(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    const wrapper = await createWrapper();
    wrapper.getComponent(MapModuleStub).vm.$emit("map-click", clickEvent());

    await vi.waitFor(() => expect(selectFeaturesSpy).toHaveBeenCalledTimes(1));
    const sources = selectFeaturesSpy.mock.calls[0]![3];
    const source = sources[0]!;
    expect(source.kind).toBe("geoadmin");
    if (source.kind !== "geoadmin") {
      throw new Error("expected a geoadmin source");
    }
    expect(source.distribution).toBeUndefined();
    expect(source.layerId).toBe("ch.test.dataset");
  });

  it("passes the click's pre-resolved vector features through to selectFeatures", async () => {
    fetchSpy.mockResolvedValue({ ok: false } as Response);
    const vectorFeature = {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [2600000, 1200000] as [number, number],
      },
      properties: { name: "test" },
    };

    const wrapper = await createWrapper();
    wrapper
      .getComponent(MapModuleStub)
      .vm.$emit("map-click", clickEvent({ "layer-1": [vectorFeature] }));

    await vi.waitFor(() => expect(selectFeaturesSpy).toHaveBeenCalledTimes(1));
    const sources = selectFeaturesSpy.mock.calls[0]![3];
    const source = sources[0]!;
    expect(source.kind).toBe("geoadmin");
    if (source.kind !== "geoadmin") {
      throw new Error("expected a geoadmin source");
    }
    expect(source.preResolvedFeatures).toEqual([vectorFeature]);
  });
});
