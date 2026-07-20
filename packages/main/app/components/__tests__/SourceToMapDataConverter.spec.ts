import type { Dimension } from "@swissgeo/dimension";
import type { DatasetLayer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { Dataset } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useDimensionsStore } from "@swissgeo/dimension";
import { useLayerStore } from "@swissgeo/layers";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SourceToMapDataConverter from "@/components/SourceToMapDataConverter.vue";

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
  emits: ["update"],
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

  it("removes the background when remove is emitted", () => {
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

    wrapper.findComponent(OgcConverterStub).vm.$emit("remove");

    expect(mockMapLayers).toHaveLength(1);
    expect(mockMapLayers[0]?.uuid).toBe("overlay");
  });
});

describe("event forwarding", () => {
  beforeEach(() => {
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
