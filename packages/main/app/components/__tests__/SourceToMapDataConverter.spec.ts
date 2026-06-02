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

  it("preserves the year of an existing ISO currentValue by matching it against the new availableValues", async () => {
    const layerStore = useLayerStore();
    layerStore.addLayer(makeSourceLayer("test-uuid", "2024-01-01T00:00:00Z"));

    const wrapper = mount(SourceToMapDataConverter, {
      shallow: true,
      props: {
        sourceBgLayer: null,
        sourceData: [makeSourceLayer("test-uuid", "2024-01-01T00:00:00Z")],
      },
    });

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
