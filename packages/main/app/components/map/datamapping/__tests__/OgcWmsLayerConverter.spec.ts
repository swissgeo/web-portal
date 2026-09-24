import type { WmsFeatureInfoCapability } from "@swissgeo/feature";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OgcWmsLayerConverter from "../OgcWmsLayerConverter.vue";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
    locale: ref("de"),
  });
});

const {
  queryable,
  getFeatureInfo,
  availableCrs,
  layerName,
  wmsDataForOl,
  defaultOpacity,
  timeInfo,
  legends,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    queryable: ref(false),
    getFeatureInfo: ref<
      WmsFeatureInfoCapability["getFeatureInfoCapability"] | null
    >(null),
    availableCrs: ref<string[]>([]),
    layerName: ref<string | null>(null),
    wmsDataForOl: ref<{
      url: string;
      gutter: number;
      version: string;
      lang: string;
    } | null>(null),
    defaultOpacity: ref<number | null>(null),
    timeInfo: ref<unknown>(null),
    legends: ref<unknown[]>([]),
  };
});

vi.mock("@/components/map/datamapping/useOgcWmsData", () => ({
  useOgcWmsData: vi.fn(() => ({
    defaultOpacity,
    wmsDataForOl,
    timeInfo,
    legends,
    availableCrs,
    getFeatureInfo,
    queryable,
    layerName,
  })),
}));

const GFI_CAPABILITY: WmsFeatureInfoCapability["getFeatureInfoCapability"] = {
  baseUrl: "https://example.test/wms?",
  method: "GET",
  formats: ["application/vnd.ogc.gml", "application/json"],
};

const OL_LAYER_DATA = {
  url: "https://example.test/wms?",
  gutter: 0,
  version: "1.3.0",
  lang: "de",
};

function mountConverter() {
  return mount(OgcWmsLayerConverter, {
    propsData: {
      distribution: null,
      serviceData: null,
      layerId: "ch.test.wms-layer",
    },
  });
}

describe("OgcWmsLayerConverter WMS capability registration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    queryable.value = false;
    getFeatureInfo.value = null;
    availableCrs.value = [];
    layerName.value = null;
    wmsDataForOl.value = null;
  });

  it("emits setWmsCapability when every parameter is set, with wmsVersion and layerName", async () => {
    const wrapper = mountConverter();

    getFeatureInfo.value = GFI_CAPABILITY;
    availableCrs.value = ["EPSG:4326", "EPSG:2056"];
    layerName.value = "ch.test.wms-layer";
    wmsDataForOl.value = OL_LAYER_DATA;
    queryable.value = true;
    await flushPromises();

    const emitted = wrapper.emitted("setWmsCapability");
    expect(emitted).toHaveLength(1);
    expect(emitted![0]).toEqual([
      {
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        getFeatureInfoCapability: GFI_CAPABILITY,
        wmsVersion: "1.3.0",
        layerName: "ch.test.wms-layer",
      },
    ]);
  });

  it("tolerates wmsDataForOl being null. wmsVersion omitted without crash ", async () => {
    const wrapper = mountConverter();

    getFeatureInfo.value = GFI_CAPABILITY;
    availableCrs.value = ["EPSG:4326"];
    queryable.value = true;
    await flushPromises();

    const emitted = wrapper.emitted("setWmsCapability");
    expect(emitted).toHaveLength(1);
    expect(
      (emitted![0]![0] as WmsFeatureInfoCapability).wmsVersion,
    ).toBeUndefined();
    expect((emitted![0]![0] as WmsFeatureInfoCapability).layerName).toBeNull();
  });

  it("does not emit when the layer is not queryable", async () => {
    const wrapper = mountConverter();

    getFeatureInfo.value = GFI_CAPABILITY;
    availableCrs.value = ["EPSG:2056"];
    wmsDataForOl.value = OL_LAYER_DATA;
    await flushPromises();

    expect(wrapper.emitted("setWmsCapability")).toBeUndefined();
  });

  it("does not emit when there is no GetFeatureInfo endpoint", async () => {
    const wrapper = mountConverter();

    availableCrs.value = ["EPSG:2056"];
    wmsDataForOl.value = OL_LAYER_DATA;
    queryable.value = true;
    await flushPromises();

    expect(wrapper.emitted("setWmsCapability")).toBeUndefined();
  });

  it("does not emit when the CRS list is empty", async () => {
    const wrapper = mountConverter();

    getFeatureInfo.value = GFI_CAPABILITY;
    wmsDataForOl.value = OL_LAYER_DATA;
    queryable.value = true;
    await flushPromises();

    expect(wrapper.emitted("setWmsCapability")).toBeUndefined();
  });
});
