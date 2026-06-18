import type { Map } from "ol";
import type BaseLayer from "ol/layer/Base";

import { mount } from "@vue/test-utils";
import Layer from "ol/layer/Layer";
import VectorSource from "ol/source/Vector";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref, shallowRef } from "vue";

import useAddLayerToMap from "../useAddLayerToMap.composable";

type FakeMap = {
  layers: BaseLayer[];
  addLayer: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
  getAllLayers: ReturnType<typeof vi.fn>;
};

function createFakeMap(): FakeMap {
  const layers: BaseLayer[] = [];

  return {
    layers,
    addLayer: vi.fn((layer: BaseLayer) => {
      layers.push(layer);
    }),
    removeLayer: vi.fn((layer: BaseLayer) => {
      const index = layers.indexOf(layer);
      if (index !== -1) {
        layers.splice(index, 1);
      }
    }),
    getAllLayers: vi.fn(() => layers),
  };
}

describe("useAddLayerToMap", () => {
  it("removes the same raw layer instance on unmount", () => {
    const fakeMap = createFakeMap();
    const rawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        const composable = useAddLayerToMap(
          olLayer,
          zIndex,
          isVisible,
          opacity,
          olMap,
        );

        return {
          ...composable,
        };
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    (wrapper.vm as { addLayerToMap: () => void }).addLayerToMap();

    expect(fakeMap.layers).toEqual([rawLayer]);

    wrapper.unmount();

    expect(fakeMap.layers).toEqual([]);
    expect(fakeMap.removeLayer).toHaveBeenCalledWith(rawLayer);
  });

  it("removes previously added layer when a new layer instance is added", () => {
    const fakeMap = createFakeMap();
    const firstRawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;
    const secondRawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(firstRawLayer);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        const composable = useAddLayerToMap(
          olLayer,
          zIndex,
          isVisible,
          opacity,
          olMap,
        );

        const setLayer = (layer: BaseLayer) => {
          olLayer.value = layer;
        };

        return {
          ...composable,
          setLayer,
        };
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);
    const vm = wrapper.vm as {
      addLayerToMap: () => void;
      setLayer: (_layer: BaseLayer) => void;
    };

    vm.addLayerToMap();
    vm.setLayer(secondRawLayer);
    vm.addLayerToMap();

    expect(fakeMap.layers).toEqual([secondRawLayer]);
    expect(fakeMap.removeLayer).toHaveBeenCalledWith(firstRawLayer);

    wrapper.unmount();
  });
});
