import type { Dimension } from "@swissgeo/dimension";
import type { FeatureData } from "@swissgeo/feature";
import type { DatasetLayer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useDimensionsStore } from "@swissgeo/dimension";
import { useFeaturesStore } from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LayerLoadErrorBoundary from "@/components/map/datamapping/LayerLoadErrorBoundary.vue";
import SourceToMapDataConverter from "@/components/SourceToMapDataConverter.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: "en" } }),
}));

const { getPopupFromIdentifyFeatureMock } = vi.hoisted(() => ({
  getPopupFromIdentifyFeatureMock: vi.fn(),
}));

vi.mock("@swissgeo/feature", async (importOriginal) => {
  // the store stays real so the preselection can be set up and the resulting
  // selection read back from it; only the popup fetching is mocked
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("@swissgeo/feature")>();

  return {
    ...actual,
    getPopupFromIdentifyFeature: getPopupFromIdentifyFeatureMock,
  };
});

const mockMapLayers: MapLayer[] = [];

const updateLayerData = vi.fn(
  (index: number, layer: MapLayer, canCreate: boolean) => {
    if (index < mockMapLayers.length) {
      mockMapLayers[index] = layer;
    } else if (canCreate) {
      mockMapLayers[index] = layer;
    }
  },
);

const removeLayer = vi.fn((identifier: string | number) => {
  const index =
    typeof identifier === "number"
      ? identifier
      : mockMapLayers.findIndex((l) => l.uuid === identifier);

  if (index >= 0) {
    mockMapLayers.splice(index, 1);
  }
});

mockNuxtImport("useMapViewStore", () => () => ({
  mapLayers: mockMapLayers,

  getMapLayers: () => computed(() => mockMapLayers),

  updateLayerData,

  removeLayer,

  addLayerToTop: (layer: MapLayer) => mockMapLayers.push(layer),
}));
const OgcConverterStub = defineComponent({
  name: "MapDatamappingOgcDatasetConverter",
  emits: [
    "error",
    "update",
    "updateDataset",
    "updateLayerInfo",
    "updateTimeDimension",
    "remove",
  ],
  template: "<div />",
});

const FileConverterStub = defineComponent({
  name: "MapDatamappingFileConverter",
  emits: ["remove", "update"],
  template: "<div />",
});

function makeSourceLayer(uuid: string) {
  return {
    uuid,
    humanId: uuid,
    type: "dataset" as const,
    isLoading: false,
  };
}

function makeDatasetLayer(uuid: string): DatasetLayer {
  return {
    uuid,
    humanId: uuid,
    type: "dataset",
    isLoading: false,
    data: {} as Dataset,
    layerUrl: `https://example.com/${uuid}`,
  };
}

function makeMapLayer(uuid: string): MapLayer {
  return {
    uuid,
    layerId: uuid,
    displayName: uuid,
    format: "WMS",
    opacity: 0.5,
    isVisible: true,
  };
}

function makeFileLayer(uuid: string) {
  return {
    uuid,
    humanId: `${uuid}.kml`,
    type: "kml" as const,
    isLoading: false,
    data: "<kml/>",
  };
}

async function emitUpdateTimeDimension(
  wrapper: ReturnType<typeof mount>,
  dimension: Partial<Dimension>,
) {
  const child = wrapper.findComponent({
    name: "MapDatamappingOgcDatasetConverter",
  });
  await child.vm.$emit("updateTimeDimension", "test-uuid", dimension);
}

describe("SourceToMapDataConverter > updateTimeDimension", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("resolves the stored year (2024) onto the incoming availableValues, ignoring the incoming currentValue (20230101)", async () => {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    layerStore.addLayer(makeSourceLayer("test-uuid"));
    dimensionsStore.setDimension("test-uuid", "time", {
      currentValue: "2024-01-01T00:00:00Z",
    });

    const wrapper = mount(SourceToMapDataConverter, {
      shallow: true,
      props: {
        sourceBgLayer: null,
        sourceData: [makeSourceLayer("test-uuid")],
      },
      global: { stubs: { LayerLoadErrorBoundary: false } },
    });

    // The store already holds "2024-01-01T00:00:00Z"; the incoming dimension
    // carries "20230101" as currentValue and ["20230101","20240101"] as
    // availableValues. The handler should extract year 2024 from the stored
    // value and match it to "20240101" in the new list, overriding the
    // incoming "20230101".
    await emitUpdateTimeDimension(wrapper, {
      availableValues: ["20230101", "20240101"],
      currentValue: "20230101",
    });

    expect(dimensionsStore.getDimensions("test-uuid")?.time?.currentValue).toBe(
      "20240101",
    );
  });

  it("uses the incoming currentValue when the existing year is not found in the new availableValues", async () => {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    layerStore.addLayer(makeSourceLayer("test-uuid"));
    dimensionsStore.setDimension("test-uuid", "time", {
      currentValue: "1999-01-01T00:00:00Z",
    });

    const wrapper = mount(SourceToMapDataConverter, {
      shallow: true,
      props: {
        sourceBgLayer: null,
        sourceData: [makeSourceLayer("test-uuid")],
      },
      global: { stubs: { LayerLoadErrorBoundary: false } },
    });

    await emitUpdateTimeDimension(wrapper, {
      availableValues: ["20230101", "20240101"],
      currentValue: "20230101",
    });

    expect(dimensionsStore.getDimensions("test-uuid")?.time?.currentValue).toBe(
      "20230101",
    );
  });

  it("uses the incoming currentValue as-is when there is no existing currentValue", async () => {
    const layerStore = useLayerStore();
    layerStore.addLayer(makeSourceLayer("test-uuid"));

    const wrapper = mount(SourceToMapDataConverter, {
      shallow: true,
      props: {
        sourceBgLayer: null,
        sourceData: [makeSourceLayer("test-uuid")],
      },
      global: { stubs: { LayerLoadErrorBoundary: false } },
    });

    await emitUpdateTimeDimension(wrapper, {
      availableValues: ["20230101", "20240101"],
      currentValue: "20230101",
    });

    expect(
      useDimensionsStore().getDimensions("test-uuid")?.time?.currentValue,
    ).toBe("20230101");
  });
});

describe("background handling", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;

    updateLayerData.mockClear();
    removeLayer.mockClear();

    const layerStore = useLayerStore();
    layerStore.$reset();
    layerStore.setBackground(null);
  });

  it("does nothing when the background converter emits null", () => {
    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: makeDatasetLayer("bg"),
        sourceData: [],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    const bgConverter = wrapper.findComponent(OgcConverterStub);

    bgConverter.vm.$emit("update", null);

    expect(updateLayerData).not.toHaveBeenCalled();
    expect(mockMapLayers).toHaveLength(0);
  });

  it("forces the background opacity to 1", () => {
    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: makeDatasetLayer("bg"),
        sourceData: [],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    const layer = makeMapLayer("bg");
    layer.opacity = 0.25;

    wrapper.findComponent(OgcConverterStub).vm.$emit("update", layer);

    expect(layer.opacity).toBe(1);
  });

  it("inserts the background at the beginning when there is no current background", () => {
    const layerStore = useLayerStore();

    layerStore.addLayer(makeDatasetLayer("overlay"));

    mockMapLayers.push(makeMapLayer("overlay"));

    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: makeDatasetLayer("bg"),
        sourceData: [],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    const background = makeMapLayer("bg");

    wrapper.findComponent(OgcConverterStub).vm.$emit("update", background);

    expect(mockMapLayers[0]).toBe(background);
    expect(updateLayerData).not.toHaveBeenCalled();
  });

  it.skip("updates the existing background instead of inserting a new one", () => {
    const layerStore = useLayerStore();

    layerStore.setBackground(makeDatasetLayer("bg"));

    mockMapLayers.push(makeMapLayer("bg"));

    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: makeDatasetLayer("bg"),
        sourceData: [],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    const replacement = makeMapLayer("bg");

    wrapper.findComponent(OgcConverterStub).vm.$emit("update", replacement);
    expect(updateLayerData).toHaveBeenCalledTimes(1);

    expect(updateLayerData).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        uuid: "bg",
        opacity: 1,
      }),
      true,
    );
  });

  it("places an imported file layer at slot 0 when there is no background", () => {
    const layerStore = useLayerStore();
    const fileLayer = {
      uuid: "file",
      humanId: "drawing.kml",
      type: "kml" as const,
      isLoading: false,
      data: "<kml/>",
    };
    layerStore.addLayer(fileLayer);

    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: null,
        sourceData: [fileLayer],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    wrapper
      .findComponent(FileConverterStub)
      .vm.$emit("update", makeMapLayer("file"));

    expect(updateLayerData).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ uuid: "file" }),
      true,
    );
  });

  it("removes the background by its emitted UUID", () => {
    mockMapLayers.push(makeMapLayer("bg"));
    mockMapLayers.push(makeMapLayer("overlay"));

    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: makeDatasetLayer("bg"),
        sourceData: [],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    wrapper.findComponent(OgcConverterStub).vm.$emit("remove", "bg");

    expect(mockMapLayers).toHaveLength(1);
    expect(mockMapLayers[0]?.uuid).toBe("overlay");
  });
});

describe("event forwarding", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;

    const layerStore = useLayerStore();
    layerStore.$reset();

    vi.spyOn(layerStore, "setLayerInfo");
    vi.spyOn(layerStore, "setLayerData");
  });

  it("forwards updateLayerInfo", () => {
    const layerStore = useLayerStore();

    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: null,
        sourceData: [makeDatasetLayer("layer-1")],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    const info = {
      title: "Layer title",
    };

    wrapper
      .findComponent(OgcConverterStub)
      .vm.$emit("updateLayerInfo", "layer-1", info);

    expect(layerStore.setLayerInfo).toHaveBeenCalledWith("layer-1", info);
  });

  it("forwards updateDataset", () => {
    const layerStore = useLayerStore();

    const wrapper = mount(SourceToMapDataConverter, {
      props: {
        sourceBgLayer: null,
        sourceData: [makeDatasetLayer("layer-1")],
      },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    const dataset = {
      id: "dataset",
    };

    wrapper
      .findComponent(OgcConverterStub)
      .vm.$emit("updateDataset", "layer-1", dataset);

    expect(layerStore.setLayerData).toHaveBeenCalledWith("layer-1", dataset);
  });
});

describe("layer load errors", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
    removeLayer.mockClear();
  });

  it.each(["dataset", "file"] as const)(
    "forwards the failed %s layer UUID and error",
    async (kind) => {
      const cause = new Error("network request failed");
      const failure = new Error("conversion failed", { cause });
      const failedLayer =
        kind === "dataset"
          ? makeDatasetLayer("failed-layer")
          : makeFileLayer("failed-layer");

      const wrapper = mount(SourceToMapDataConverter, {
        props: { sourceBgLayer: null, sourceData: [failedLayer] },
        global: {
          stubs: {
            MapDatamappingOgcDatasetConverter: OgcConverterStub,
            MapDatamappingFileConverter: FileConverterStub,
          },
        },
      });
      const errorSource =
        kind === "dataset"
          ? wrapper.findComponent(OgcConverterStub)
          : wrapper.findComponent(LayerLoadErrorBoundary);
      await errorSource.vm.$emit("error", failure);

      expect(wrapper.emitted("layerError")).toEqual([
        [failedLayer.uuid, failure],
      ]);
    },
  );

  it("forwards a failed background UUID and error", async () => {
    const failure = new Error("background conversion failed");
    const background = makeDatasetLayer("background");

    const wrapper = mount(SourceToMapDataConverter, {
      props: { sourceBgLayer: background, sourceData: [] },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });
    await wrapper
      .findComponent(LayerLoadErrorBoundary)
      .vm.$emit("error", failure);

    expect(wrapper.emitted("layerError")).toEqual([[background.uuid, failure]]);
  });

  it("forwards a direct background converter error", () => {
    const failure = new Error("background conversion failed");
    const background = makeDatasetLayer("background");
    const wrapper = mount(SourceToMapDataConverter, {
      props: { sourceBgLayer: background, sourceData: [] },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    wrapper.findComponent(OgcConverterStub).vm.$emit("error", failure);

    expect(wrapper.emitted("layerError")).toEqual([[background.uuid, failure]]);
  });

  it("converts a non-Error failure before forwarding it", () => {
    const failedLayer = makeDatasetLayer("failed-layer");
    const wrapper = mount(SourceToMapDataConverter, {
      props: { sourceBgLayer: null, sourceData: [failedLayer] },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });

    wrapper.findComponent(OgcConverterStub).vm.$emit("error", "failure");

    expect(wrapper.emitted("layerError")).toEqual([
      [failedLayer.uuid, new Error("failure")],
    ]);
  });
});

describe("state import feature selection", () => {
  const BASE_URL = "https://example.test/MapServer";
  // mapLayerData.layerId is the uuid ("test-uuid") in this suite's stubs
  const URL_TEMPLATE = `${BASE_URL}/test-uuid/{featureId}/htmlPopup?lang={lang}`;

  const identifyFeatures: {
    id: string;
    geometry: { type: "Point"; coordinates: [number, number] };
  }[] = [{ id: "42", geometry: { type: "Point", coordinates: [0, 0] } }];
  const popupFeatures: FeatureData[] = [
    {
      featureId: "42",
      geometry: { type: "Point", coordinates: [0, 0] },
      content: {
        kind: "html",
        html: "<p>popup</p>",
        trusted: true,
        shareable: true,
      },
    },
  ];

  const fetchSpy = vi.fn();

  /**
   * A dataset layer whose store info carries harvested feature-info
   * information ({protocol, baseUrl}), as makeServerLayer leaves it after
   * the featureinfo chain walk.
   */
  function makeDatasetLayerWithFeatureInfo(
    uuid: string,
    featureInfoInformation?: {
      protocol?: string;
      baseUrl?: string;
    },
  ): DatasetLayer {
    return {
      ...makeDatasetLayer(uuid),
      info: {
        displayName: uuid,
        featureInfoInformation: featureInfoInformation ?? {
          protocol: "geoadmin:features",
          baseUrl: BASE_URL,
        },
      },
    };
  }

  function mountConverter(sourceData: DatasetLayer[]) {
    return mount(SourceToMapDataConverter, {
      props: { sourceBgLayer: null, sourceData },
      global: {
        stubs: {
          MapDatamappingOgcDatasetConverter: OgcConverterStub,
          MapDatamappingFileConverter: FileConverterStub,
        },
      },
    });
  }

  async function emitLayerUpdate(
    wrapper: ReturnType<typeof mountConverter>,
  ): Promise<void> {
    wrapper
      .findComponent(OgcConverterStub)
      .vm.$emit("update", makeMapLayer("test-uuid"));
    await flushPromises();
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;

    getPopupFromIdentifyFeatureMock.mockReset();
    getPopupFromIdentifyFeatureMock.mockResolvedValue([...popupFeatures]);

    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies a stored preselection by building the popup template from the stored feature info", async () => {
    const layerStore = useLayerStore();
    const featureStore = useFeaturesStore();
    const layer = makeDatasetLayerWithFeatureInfo("test-uuid");
    layerStore.addLayer(layer);
    featureStore.addFeaturePreselection("test-uuid", identifyFeatures);

    const wrapper = mountConverter([layer]);
    await emitLayerUpdate(wrapper);

    // the preselection reads the already-harvested info: no fetching anymore
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getPopupFromIdentifyFeatureMock).toHaveBeenCalledWith(
      identifyFeatures,
      URL_TEMPLATE,
      "en",
    );
    expect(featureStore.selectedFeaturesByUuid["test-uuid"]).toEqual(
      popupFeatures,
    );
  });

  it("does not fetch anything when no preselection is stored for the layer", async () => {
    const layerStore = useLayerStore();
    const layer = makeDatasetLayerWithFeatureInfo("test-uuid");
    layerStore.addLayer(layer);

    const wrapper = mountConverter([layer]);
    await emitLayerUpdate(wrapper);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getPopupFromIdentifyFeatureMock).not.toHaveBeenCalled();
    expect(useFeaturesStore().selectedFeaturesByUuid).toEqual({});
  });

  it("does not select when the layer info carries no feature info", async () => {
    const layerStore = useLayerStore();
    const featureStore = useFeaturesStore();
    const layer = makeDatasetLayer("test-uuid");
    layerStore.addLayer(layer);
    featureStore.addFeaturePreselection("test-uuid", identifyFeatures);

    const wrapper = mountConverter([layer]);
    await emitLayerUpdate(wrapper);

    expect(getPopupFromIdentifyFeatureMock).not.toHaveBeenCalled();
    expect(featureStore.selectedFeaturesByUuid).toEqual({});
  });

  it("does not select when the protocol is not identify-capable", async () => {
    const layerStore = useLayerStore();
    const featureStore = useFeaturesStore();
    const layer = makeDatasetLayerWithFeatureInfo("test-uuid", {
      protocol: "ogc:wms",
      baseUrl: BASE_URL,
    });
    layerStore.addLayer(layer);
    featureStore.addFeaturePreselection("test-uuid", identifyFeatures);

    const wrapper = mountConverter([layer]);
    await emitLayerUpdate(wrapper);

    expect(getPopupFromIdentifyFeatureMock).not.toHaveBeenCalled();
    expect(featureStore.selectedFeaturesByUuid).toEqual({});
  });

  it("does not select when the info has no baseUrl to build the template from", async () => {
    const layerStore = useLayerStore();
    const featureStore = useFeaturesStore();
    const layer = makeDatasetLayerWithFeatureInfo("test-uuid", {
      protocol: "geoadmin:features",
    });
    layerStore.addLayer(layer);
    featureStore.addFeaturePreselection("test-uuid", identifyFeatures);

    const wrapper = mountConverter([layer]);
    await emitLayerUpdate(wrapper);

    expect(getPopupFromIdentifyFeatureMock).not.toHaveBeenCalled();
    expect(featureStore.selectedFeaturesByUuid).toEqual({});
  });
});
