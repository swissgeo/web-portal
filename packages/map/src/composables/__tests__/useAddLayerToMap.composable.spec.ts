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

  it("syncs zIndex when zIndex ref changes", async () => {
    const fakeMap = createFakeMap();
    const rawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;
    const setZIndexSpy = vi.fn();
    Object.defineProperty(rawLayer, "setZIndex", { value: setZIndexSpy });

    const zIndex = ref(5);

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    zIndex.value = 10;
    await wrapper.vm.$nextTick();

    expect(setZIndexSpy).toHaveBeenCalledWith(10);

    wrapper.unmount();
  });

  it("syncs visibility when isVisible ref changes", async () => {
    const fakeMap = createFakeMap();
    const rawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;
    const setVisibleSpy = vi.fn();
    Object.defineProperty(rawLayer, "setVisible", { value: setVisibleSpy });

    const isVisible = ref(true);

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const zIndex = ref(5);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    isVisible.value = false;
    await wrapper.vm.$nextTick();

    expect(setVisibleSpy).toHaveBeenCalledWith(false);

    wrapper.unmount();
  });

  it("syncs opacity when opacity ref changes", async () => {
    const fakeMap = createFakeMap();
    const rawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;
    const setOpacitySpy = vi.fn();
    Object.defineProperty(rawLayer, "setOpacity", { value: setOpacitySpy });

    const opacity = ref(1);

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    opacity.value = 0.5;
    await wrapper.vm.$nextTick();

    expect(setOpacitySpy).toHaveBeenCalledWith(0.5);

    wrapper.unmount();
  });

  it("does nothing when olMap is undefined", () => {
    const rawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(undefined);

        return useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    (wrapper.vm as { addLayerToMap: () => void }).addLayerToMap();

    // No fakeMap to check — the composable should just return without error
    wrapper.unmount();
  });

  it("does nothing when olLayer is undefined", () => {
    const fakeMap = createFakeMap();

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(undefined);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        return useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    (wrapper.vm as { addLayerToMap: () => void }).addLayerToMap();

    expect(fakeMap.layers).toEqual([]);

    wrapper.unmount();
  });

  it("skips re-adding layer already on the map and only syncs zIndex", () => {
    const fakeMap = createFakeMap();
    const rawLayer = new Layer({
      source: new VectorSource(),
    }) as unknown as BaseLayer;
    const setZIndexSpy = vi.fn();
    Object.defineProperty(rawLayer, "setZIndex", { value: setZIndexSpy });

    // Pre-add layer to map
    fakeMap.layers.push(rawLayer);

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        return useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    (wrapper.vm as { addLayerToMap: () => void }).addLayerToMap();

    // Should not add again, just sync zIndex
    expect(fakeMap.layers).toEqual([rawLayer]);
    expect(fakeMap.addLayer).not.toHaveBeenCalled();
    expect(setZIndexSpy).toHaveBeenCalledWith(5);

    wrapper.unmount();
  });

  it("clears VectorSource on unmount", () => {
    const fakeMap = createFakeMap();
    const vectorSource = new VectorSource();
    const clearSpy = vi.spyOn(vectorSource, "clear");
    const rawLayer = new Layer({
      source: vectorSource,
    }) as unknown as BaseLayer;

    const TestComponent = defineComponent({
      setup() {
        const olLayer = shallowRef<BaseLayer | undefined>(rawLayer);
        const zIndex = ref(5);
        const isVisible = ref(true);
        const opacity = ref(1);
        const olMap = shallowRef<Map | undefined>(fakeMap as unknown as Map);

        useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap);
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    wrapper.unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});
