import type { MapClickEvent } from "@swissgeo/map";

import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent } from "vue";

import BaseMapViewer from "../BaseMapViewer.vue";

const DISTRIBUTION_URL = "https://example.test/distributions";

const mockLayers = [
  {
    uuid: "layer-1",
    layerId: "1",
    type: "dataset",
    displayName: "Layer 1",
    opacity: 1,
    data: {
      id: "ch.test.dataset",
      links: [{ rel: "distributions", href: DISTRIBUTION_URL }],
    },
  },
  {
    uuid: "layer-2",
    layerId: "2",
    displayName: "Layer 2",
    opacity: 1,
  },
];

const getMapLayers = vi.fn(() => computed(() => mockLayers));
// the click handler checks visibility, this allows us to set it per test
const layerVisibility: Record<
  string,
  { isVisible: boolean; opacity: number } | undefined
> = {};
const getMapLayerFromUuid = vi.fn((uuid: string) => layerVisibility[uuid]);

mockNuxtImport("useMapViewStore", () => {
  return () => ({
    getMapLayers,
    getMapLayerFromUuid,
  });
});
vi.mock("@swissgeo/layers", () => {
  return {
    isDatasetLayer: (layer: { type: string }) => layer.type === "dataset",
    useLayerStore: () => ({
      layers: mockLayers,
      backgroundLayer: { uuid: "layer-1" },
    }),
  };
});

vi.mock("~/stores/mapView", () => ({
  useMapViewStore: () => ({
    getMapLayers,
    getMapLayerFromUuid,
  }),
}));

vi.mock("@swissgeo/feature", () => ({
  selectFeatures: vi.fn(),
  FEATURE_LIMIT: 10,

  useFeaturesStore: () => ({
    hasSelectedFeatures: false,
    $reset: vi.fn(),
  }),
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

const SourceToMapDataConverterStub = defineComponent({
  name: "SourceToMapDataConverter",
  props: ["sourceBgLayer", "sourceData"],
  template: "<div data-testid='converter' />",
});

const ToolboxStub = defineComponent({
  name: "Toolbox",
  template: "<div data-testid='toolbox' />",
});

const FeatureInfoPopoverStub = defineComponent({
  name: "FeaturesinfoFeatureInfoPopover",
  template: "<div data-testid='feature-info-popover' />",
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

const fetchSpy = vi.fn();

function clickEvent(
  vectorFeaturesPerLayer: MapClickEvent["vectorFeaturesPerLayer"] = {},
  pixel: MapClickEvent["pixel"] = [10, 10],
): MapClickEvent {
  return {
    coordinate: [2600000, 1200000],
    pixel,
    extent: [2599000, 1199000, 2601000, 1201000],
    viewportSize: [800, 600],
    vectorFeaturesPerLayer,
  };
}

function setAllLayersVisible(): void {
  layerVisibility["layer-1"] = { isVisible: true, opacity: 1 };
  layerVisibility["layer-2"] = { isVisible: true, opacity: 1 };
}

describe("BaseMapViewer — map click abort handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
    setAllLayersVisible();
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
          FeaturesinfoFeatureInfoPopover: FeatureInfoPopoverStub,
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
    // layer-1 (distributions-fetched) and layer-2 (no link) both pass the filter
    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({
      kind: "geoadmin",
      layerUuid: "layer-1",
      layerId: "ch.test.dataset",
    });

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

describe("BaseMapViewer — identify-source filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
    setAllLayersVisible();
  });

  async function createWrapper(props: Record<string, unknown> = {}) {
    return await mountSuspended(BaseMapViewer, {
      props,
      global: {
        stubs: {
          ClientOnly: {
            template: "<div><slot /></div>",
          },
          MapModule: MapModuleStub,
          SourceToMapDataConverter: SourceToMapDataConverterStub,
          Toolbox: ToolboxStub,
          FeaturesinfoFeatureInfoPopover: FeatureInfoPopoverStub,
        },
      },
    });
  }

  async function sourceUuidsAfterClick(
    wrapper: Awaited<ReturnType<typeof createWrapper>>,
    event: MapClickEvent,
  ): Promise<string[]> {
    wrapper.getComponent(MapModuleStub).vm.$emit("map-click", event);
    await vi.waitFor(() => expect(selectFeaturesSpy).toHaveBeenCalledOnce());
    const sources = selectFeaturesSpy.mock.calls[0]![3] as Array<{
      layerUuid: string;
    }>;
    return sources.map((source) => source.layerUuid);
  }

  it("filters out hidden layers (isVisible === false)", async () => {
    layerVisibility["layer-2"] = { isVisible: false, opacity: 1 };

    const wrapper = await createWrapper();
    const uuids = await sourceUuidsAfterClick(wrapper, clickEvent());

    expect(uuids).toEqual(["layer-1"]);
  });

  it("filters out layers with an opacity of 0", async () => {
    layerVisibility["layer-2"] = { isVisible: true, opacity: 0 };

    const wrapper = await createWrapper();
    const uuids = await sourceUuidsAfterClick(wrapper, clickEvent());

    expect(uuids).toEqual(["layer-1"]);
  });

  it("drops layers that have no converted map layer yet", async () => {
    // allowlist semantics: pending conversion = not identifiable
    delete layerVisibility["layer-2"];

    const wrapper = await createWrapper();
    const uuids = await sourceUuidsAfterClick(wrapper, clickEvent());

    expect(uuids).toEqual(["layer-1"]);
  });

  it("drops the compare-clipped layer when the click is right of the slider", async () => {
    const wrapper = await createWrapper({
      compareSliderActive: true,
      compareRatio: 0.5,
      compareSliderClippedLayer: {
        uuid: "layer-1",
        layerId: "1",
        displayName: "Layer 1",
      },
    });

    // pixel[0]=700 > 0.5 * 800 → right of the bar
    const uuids = await sourceUuidsAfterClick(
      wrapper,
      clickEvent({}, [700, 10]),
    );

    expect(uuids).toEqual(["layer-2"]);
  });

  it("keeps the compare-clipped layer when the click is left of the slider", async () => {
    const wrapper = await createWrapper({
      compareSliderActive: true,
      compareRatio: 0.5,
      compareSliderClippedLayer: {
        uuid: "layer-1",
        layerId: "1",
        displayName: "Layer 1",
      },
    });

    // pixel[0]=100 < 0.5 * 800 → left of the bar, clipped layer visible there
    const uuids = await sourceUuidsAfterClick(
      wrapper,
      clickEvent({}, [100, 10]),
    );

    expect(uuids).toEqual(["layer-1", "layer-2"]);
  });

  it("keeps the clipped layer on right-side clicks when the slider is inactive", async () => {
    const wrapper = await createWrapper({
      compareSliderClippedLayer: {
        uuid: "layer-1",
        layerId: "1",
        displayName: "Layer 1",
      },
    });

    const uuids = await sourceUuidsAfterClick(
      wrapper,
      clickEvent({}, [700, 10]),
    );

    expect(uuids).toEqual(["layer-1", "layer-2"]);
  });

  // Small remark here: in production, if we have
  // layers, an active compare slider, a compare ratio, and no cut layer,
  // it should be an error (or a transitory state, but unlikely). This test is mainly
  // here to fully test the guard in front of the filter.
  it("keeps the clipped layer when no clipped layer is set", async () => {
    const wrapper = await createWrapper({
      compareSliderActive: true,
      compareRatio: 0.5,
    });

    const uuids = await sourceUuidsAfterClick(
      wrapper,
      clickEvent({}, [700, 10]),
    );

    expect(uuids).toEqual(["layer-1", "layer-2"]);
  });
});
