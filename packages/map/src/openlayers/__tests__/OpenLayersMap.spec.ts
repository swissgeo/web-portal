import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
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

vi.mock("@/stores/map", () => ({
  useMapStore: () => ({
    setIsMapLoaded: vi.fn(),
    setOlMap: vi.fn(),
  }),
}));

const OpenLayersVisibleLayerStub = defineComponent({
  name: "OpenLayersVisibleLayer",
  props: ["customLayerRenderers", "layer"],
  emits: ["layerError"],
  template: "<div />",
});

describe("OpenLayersMap", () => {
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
});
