import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import type { Layer } from "@/types/layers";

import OpenLayersMap from "../OpenLayersMap.vue";

const map = {
  once: vi.fn(),
  setTarget: vi.fn(),
};

vi.mock("@/composables/createOlMap", () => ({
  default: vi.fn(() => ({ map })),
}));

const { mapStore } = vi.hoisted(() => {
  const mapStore = {
    olMap: undefined as unknown,
    setIsMapLoaded: vi.fn(),
    setOlMap: vi.fn(),
  };
  return { mapStore };
});

vi.mock("@/stores/map", () => ({
  useMapStore: () => mapStore,
}));

const OpenLayersVisibleLayerStub = defineComponent({
  name: "OpenLayersVisibleLayer",
  props: ["customLayerRenderers", "layer"],
  emits: ["layerError"],
  template: "<div />",
});

describe("OpenLayersMap", () => {
  beforeEach(() => {
    mapStore.olMap = undefined;
    mapStore.setOlMap.mockClear();
  });

  it("forwards layer errors", () => {
    const layer = {
      format: "KMZ",
      layerId: "local.kmz",
      uuid: "local-kmz",
      opacity: 1,
      isVisible: true,
      data: new Uint8Array([1, 2, 3]),
    } as Layer;
    const failure = new Error("Invalid KMZ");
    const wrapper = mount(OpenLayersMap, {
      props: { layers: [layer] },
      global: {
        stubs: { OpenLayersVisibleLayer: OpenLayersVisibleLayerStub },
      },
    });

    wrapper
      .getComponent(OpenLayersVisibleLayerStub)
      .vm.$emit("layerError", layer.uuid, failure);

    expect(wrapper.emitted("layerError")).toEqual([[layer.uuid, failure]]);
  });

  it("registers its map in the store", () => {
    mount(OpenLayersMap, {
      props: { layers: [] },
      global: {
        stubs: { OpenLayersVisibleLayer: OpenLayersVisibleLayerStub },
      },
    });

    expect(mapStore.setOlMap).toHaveBeenCalledWith(map);
  });

  it("clears the store map when the map unmounts", () => {
    const wrapper = mount(OpenLayersMap, {
      props: { layers: [] },
      global: {
        stubs: { OpenLayersVisibleLayer: OpenLayersVisibleLayerStub },
      },
    });
    mapStore.olMap = map;

    wrapper.unmount();

    expect(mapStore.setOlMap).toHaveBeenCalledWith(null);
    expect(mapStore.setOlMap.mock.calls.at(-1)).toEqual([null]);
  });

  it("keeps a newer map in the store when an older one unmounts", () => {
    const wrapper = mount(OpenLayersMap, {
      props: { layers: [] },
      global: {
        stubs: { OpenLayersVisibleLayer: OpenLayersVisibleLayerStub },
      },
    });
    const newerMap = { once: vi.fn(), setTarget: vi.fn() };
    mapStore.olMap = newerMap;

    wrapper.unmount();

    expect(mapStore.setOlMap).toHaveBeenCalledTimes(1);
    expect(mapStore.setOlMap).not.toHaveBeenCalledWith(null);
  });
});
