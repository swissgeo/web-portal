import type { DatasetLayer } from "@swissgeo/layers";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OgcDatasetConverter from "../OgcDatasetConverter.vue";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
    locale: ref("de"),
  });
});

const {
  distributionCollection,
  layerSpecificData,
  distribution,
  serviceData,
  layerFormat,
  layerId,
  ogcErrorCallbacks,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    distributionCollection: ref(null),
    layerSpecificData: ref(),
    distribution: ref(null),
    serviceData: ref(null),
    layerFormat: ref("WMTS"),
    layerId: ref("layer-id"),
    ogcErrorCallbacks: [] as ((_error: unknown) => void)[],
  };
});

vi.mock("@/components/map/datamapping/useGenericOgcData", () => ({
  useGenericOgcData: vi.fn(
    (_layer: unknown, onError: (_error: unknown) => void) => {
      ogcErrorCallbacks.push(onError);
      return {
        distributionCollection,
        layerSpecificData,
        distribution,
        serviceData,
        layerFormat,
        layerId,
      };
    },
  ),
}));

vi.mock("@/components/map/datamapping/useDatasetLocaleRefresh", () => ({
  default: vi.fn(() => ({})),
}));

const { wmsFeatureInfoCapability, useWmsFeatureInfoCapabilitiesMock } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    const wmsFeatureInfoCapability = ref<{
      availableCrs: string[];
      getFeatureInfoCapability: {
        baseUrl: string;
        method: "GET" | "POST";
        formats: string[];
      };
      wmsVersion: string | null;
      layerName: string | null;
    } | null>(null);
    const useWmsFeatureInfoCapabilitiesMock = vi.fn(
      (_layerId: string | null, _capabilityUrl: { value: string | null }) =>
        wmsFeatureInfoCapability,
    );
    return { wmsFeatureInfoCapability, useWmsFeatureInfoCapabilitiesMock };
  });

vi.mock("@swissgeo/ogc", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("@swissgeo/ogc")>();
  return {
    ...actual,
    useWmsFeatureInfoCapabilities: useWmsFeatureInfoCapabilitiesMock,
  };
});

const WmtsConverterStub = defineComponent({
  name: "MapDatamappingOgcWmtsLayerConverter",
  template: "<div>WMTS converter</div>",
});

const WmsConverterStub = defineComponent({
  name: "MapDatamappingOgcWmsLayerConverter",
  emits: ["setWmsCapability"],
  template: "<div>WMS converter</div>",
});

describe("DatasetLayer Mapper/Converter Component for WMTS", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    ogcErrorCallbacks.length = 0;
    layerFormat.value = "WMTS";
    wmsFeatureInfoCapability.value = null;
    useWmsFeatureInfoCapabilitiesMock.mockClear();
  });

  it("emits the basic data regardless of the OGC travelling", () => {
    const wrapper = mount(OgcDatasetConverter, {
      shallow: true,
      propsData: {
        layer: {
          isLoading: false,
          type: "dataset",
          humanId: "human-id",
          uuid: "some-fancy-uuid",
          // @ts-expect-error intentionally not giving a dataset
          data: null,
        },
      },
    });

    expect(wrapper.emitted()).toHaveProperty("update");
    expect(wrapper.emitted("update")).toHaveLength(1);
    expect(wrapper.emitted("update")![0]).toEqual([
      {
        layerId: "layer-id",
        uuid: "some-fancy-uuid",
        format: "WMTS",
        dimensions: null,
        displayName: "human-id",
      },
    ]);

    const error = new Error("request failed");
    ogcErrorCallbacks[0]!(error);
    expect(wrapper.emitted("error")).toEqual([[error]]);
  });

  it("emits the update if the basic data is updated", async () => {
    const layerData = {
      isLoading: false,
      type: "dataset" as const,
      humanId: "human-id",
      uuid: "some-fancy-uuid",
      data: null,
    }; // layer data as from the layer store
    const wrapper = mount(OgcDatasetConverter, {
      shallow: true,
      propsData: {
        // @ts-expect-error intentionally not giving data
        layer: layerData,
      },
    });

    expect(wrapper.emitted()).toHaveProperty("update");
    expect(wrapper.emitted("update")).toHaveLength(1);
    // not testing initial state as that's covered by the test above

    // @ts-expect-error intentionally not giving a dataset
    await wrapper.setProps({ layer: { ...layerData, isVisible: false } });
    // we got an update!
    expect(wrapper.emitted("update")).toHaveLength(2);
    expect(wrapper.emitted("update")![1]).toEqual([
      {
        layerId: "layer-id",
        uuid: "some-fancy-uuid",
        format: "WMTS",
        dimensions: null,
        displayName: "human-id",
      },
    ]);
  });

  it("renders the correct sub-converter depending on the deduced layer type", async () => {
    const wrapper = mount(OgcDatasetConverter, {
      propsData: {
        layer: {
          isLoading: false,
          type: "dataset",
          humanId: "human-id",
          uuid: "some-fancy-uuid",
          // @ts-expect-error intentionally not giving a dataset
          data: null,
        },
      },
      global: {
        stubs: {
          MapDatamappingOgcWmtsLayerConverter: {
            template: "<div>WMTS converter</div>",
          },
          MapDatamappingOgcWmsLayerConverter: {
            template: "<div>WMS converter</div>",
          },
        },
      },
    });

    expect(wrapper.text()).toEqual("WMTS converter");

    // changing the protocol in the service
    layerFormat.value = "WMS";

    // see if it reactively reacts to the change in the data
    await flushPromises();
    expect(wrapper.text()).toEqual("WMS converter");
  });

  it("forwards the WMS sub-converter's capability together with the layer uuid", async () => {
    layerFormat.value = "WMS";
    const capability = {
      getFeatureInfoCapability: {
        baseUrl: "https://example.test/wms?",
        method: "GET",
        formats: ["application/json"],
      },
      availableCrs: ["EPSG:2056"],
    };
    const wrapper = mount(OgcDatasetConverter, {
      propsData: {
        layer: {
          isLoading: false,
          type: "dataset",
          humanId: "human-id",
          uuid: "some-fancy-uuid",
          // @ts-expect-error intentionally not giving a dataset
          data: null,
        },
      },
      global: {
        stubs: {
          MapDatamappingOgcWmtsLayerConverter: WmtsConverterStub,
          MapDatamappingOgcWmsLayerConverter: WmsConverterStub,
        },
      },
    });
    await flushPromises();

    wrapper
      .findComponent(WmsConverterStub)
      .vm.$emit("setWmsCapability", capability);

    expect(wrapper.emitted("setWmsCapability")).toEqual([
      ["some-fancy-uuid", capability],
    ]);
  });

  it("emit update contains the layerSpecificData ", async () => {
    const wrapper = mount(OgcDatasetConverter, {
      shallow: true,
      propsData: {
        layer: {
          isLoading: false,
          type: "dataset",
          humanId: "human-id",
          uuid: "some-fancy-uuid",
          // @ts-expect-error intentionally not giving a dataset
          data: null,
        },
      },
    });
    // @ts-expect-error Type-checker can't deduce that this method actually exists
    // but isn't really exposed
    wrapper.vm.pushLayerSpecificData(1, {
      options: {
        url: "http://swissgeo.ch",
      },
    });
    await flushPromises();

    expect(wrapper.emitted("update")).toHaveLength(2);
    expect(wrapper.emitted("update")!.pop()!.pop()).toHaveProperty("options", {
      url: "http://swissgeo.ch",
    });
  });

  it("emits the remove if the converter gets unmounted", async () => {
    const wrapper = mount(OgcDatasetConverter, {
      shallow: true,
      propsData: {
        layer: {
          isLoading: false,
          type: "dataset",
          humanId: "human-id",
          uuid: "some-fancy-uuid",
          // @ts-expect-error intentionally not giving a dataset
          data: null,
        },
      },
    });
    wrapper.unmount();
    await flushPromises();

    expect(wrapper.emitted("remove")).toEqual([["some-fancy-uuid"]]);
  });

  describe("WMTS-side WMS feature info gate", () => {
    const ogcWmsLayer = (): DatasetLayer =>
      ({
        isLoading: false,
        type: "dataset",
        humanId: "human-id",
        uuid: "some-fancy-uuid",
        info: {
          displayName: "Human",
          featureInfoInformation: {
            protocol: "ogc:wms",
            baseUrl: "https://example.test/wms-capabilities",
          },
        },
        data: null,
      }) as unknown as DatasetLayer;

    const mountConverter = (layer: DatasetLayer) =>
      mount(OgcDatasetConverter, {
        propsData: { layer },
        global: {
          stubs: {
            MapDatamappingOgcWmtsLayerConverter: WmtsConverterStub,
            MapDatamappingOgcWmsLayerConverter: WmsConverterStub,
          },
        },
      });

    it("feeds the feature info baseUrl to the composable for a WMTS layer with an ogc:wms protocol", () => {
      mountConverter(ogcWmsLayer());

      expect(useWmsFeatureInfoCapabilitiesMock).toHaveBeenCalledTimes(1);
      const [layerId, capabilityUrl] =
        useWmsFeatureInfoCapabilitiesMock.mock.calls[0]!;
      expect(layerId).toBe("human-id");
      expect(capabilityUrl.value).toBe("https://example.test/wms-capabilities");
    });

    it("keeps the gate closed (null URL) for non-ogc:wms protocols", () => {
      const layer = ogcWmsLayer();
      layer.info!.featureInfoInformation = {
        protocol: "geoadmin:features",
        baseUrl: "https://example.test/MapServer",
      };

      mountConverter(layer);

      const [, capabilityUrl] =
        useWmsFeatureInfoCapabilitiesMock.mock.calls[0]!;
      expect(capabilityUrl.value).toBeNull();
    });

    it("keeps the gate closed when the layer is rendered as WMS", () => {
      layerFormat.value = "WMS";

      mountConverter(ogcWmsLayer());

      const [, capabilityUrl] =
        useWmsFeatureInfoCapabilitiesMock.mock.calls[0]!;
      expect(capabilityUrl.value).toBeNull();
    });

    it("emits the parsed capability under the layer uuid once it resolves", async () => {
      const parts = {
        availableCrs: ["EPSG:2056"],
        getFeatureInfoCapability: {
          baseUrl: "https://example.test/wms?",
          method: "GET" as const,
          formats: ["application/json"],
        },
        wmsVersion: "1.3.0",
        layerName: "wms.layer.name",
      };

      const wrapper = mountConverter(ogcWmsLayer());
      expect(wrapper.emitted("setWmsCapability")).toBeUndefined();

      wmsFeatureInfoCapability.value = parts;
      await flushPromises();

      expect(wrapper.emitted("setWmsCapability")).toEqual([
        ["some-fancy-uuid", parts],
      ]);
    });

    it("stays silent while the composable yields null", async () => {
      const wrapper = mountConverter(ogcWmsLayer());
      await flushPromises();

      expect(wrapper.emitted("setWmsCapability")).toBeUndefined();
    });
  });
});
