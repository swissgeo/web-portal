import type { Dimension } from "@swissgeo/layers";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useLayerStore } from "@swissgeo/layers";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import SourceToMapDataConverter from "../SourceToMapDataConverter.vue";

mockNuxtImport("useMapViewStore", () => {
  return () => ({
    getMapLayers: () => ref([]),
    updateLayerData: () => {},
    updateLayerOpacity: () => {},
  });
});

function makeSourceLayer(uuid: string, currentValue?: string) {
  return {
    uuid,
    humanId: uuid,
    type: "dataset" as const,
    isLoading: false,
    ...(currentValue !== undefined
      ? { dimensions: { time: { availableValues: [], currentValue } } }
      : {}),
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
    layerStore.addLayer(makeSourceLayer("test-uuid", "2024-01-01T00:00:00Z"));

    const wrapper = mount(SourceToMapDataConverter, {
      shallow: true,
      props: {
        sourceBgLayer: null,
        sourceData: [makeSourceLayer("test-uuid", "2024-01-01T00:00:00Z")],
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

    expect(
      layerStore.getLayer("test-uuid")?.dimensions?.time?.currentValue,
    ).toBe("20240101");
  });

  it("uses the incoming currentValue when the existing year is not found in the new availableValues", async () => {
    const layerStore = useLayerStore();
    layerStore.addLayer(makeSourceLayer("test-uuid", "1999-01-01T00:00:00Z"));

    const wrapper = mount(SourceToMapDataConverter, {
      shallow: true,
      props: {
        sourceBgLayer: null,
        sourceData: [makeSourceLayer("test-uuid", "1999-01-01T00:00:00Z")],
      },
    });

    await emitUpdateTimeDimension(wrapper, {
      availableValues: ["20230101", "20240101"],
      currentValue: "20230101",
    });

    expect(
      layerStore.getLayer("test-uuid")?.dimensions?.time?.currentValue,
    ).toBe("20230101");
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
      layerStore.getLayer("test-uuid")?.dimensions?.time?.currentValue,
    ).toBe("20230101");
  });
});
