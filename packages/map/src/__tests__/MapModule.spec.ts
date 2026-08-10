import type { VueWrapper } from "@vue/test-utils";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { Layer } from "@/types/layers";

import MapModule from "../MapModule.vue";

vi.mock("../openlayers/OpenLayersMap.vue", () => ({
  default: {
    template: `<div class="ol-map"><slot /></div>`,
    props: ["customLayerRenderers", "layers", "zoomOnlyCtrl"],
  },
}));

vi.mock("../openlayers/OpenLayersContextMenuPopup.vue", () => ({
  default: {
    template: `<div class="ol-context-menu"><slot /></div>`,
  },
}));

vi.mock("../openlayers/OpenLayersMouseTracker.vue", () => ({
  default: { template: `<div class="ol-mouse-tracker" />` },
}));

vi.mock("../openlayers/OpenLayersScale.vue", () => ({
  default: { template: `<div class="ol-scale" />` },
}));

vi.mock("../openlayers/OpenLayersScalePrint.vue", () => ({
  default: { template: `<div class="ol-scale-print" />` },
}));

vi.mock("../openlayers/OpenLayersCompareSlider.vue", () => ({
  default: {
    template: `<div class="ol-compare-slider" />`,
    props: ["compareRatio", "clippedLayer"],
    emits: ["update:compareRatio"],
  },
}));

function makeLayer(overrides?: Partial<Layer>): Layer {
  return {
    format: "WMTS",
    layerId: "layer-1",
    uuid: "uuid-1",
    opacity: 1,
    isVisible: true,
    ...overrides,
  };
}

function defaultProps(overrides?: Record<string, unknown>) {
  return {
    layers: [makeLayer()],
    displayMode: "web" as const,
    ...overrides,
  };
}

describe("MapModule", () => {
  describe("layersWithZIndex computed", () => {
    it("assigns zIndex based on array index", () => {
      const layers = [makeLayer({ layerId: "a" }), makeLayer({ layerId: "b" })];
      mount(MapModule, { props: defaultProps({ layers }) });
      expect(layers[0].zIndex).toBe(0);
      expect(layers[1].zIndex).toBe(1);
    });

    it("assigns sequential zIndex to multiple layers", () => {
      const layers = [makeLayer(), makeLayer(), makeLayer()];
      mount(MapModule, { props: defaultProps({ layers }) });
      expect(layers[0].zIndex).toBe(0);
      expect(layers[1].zIndex).toBe(1);
      expect(layers[2].zIndex).toBe(2);
    });
  });

  describe("displayMode: web", () => {
    it("renders context menu popup, mouse tracker, and scale", () => {
      const wrapper = mount(MapModule, { props: defaultProps() });
      expect(wrapper.find(".ol-context-menu").exists()).toBe(true);
      expect(wrapper.find(".ol-mouse-tracker").exists()).toBe(true);
      expect(wrapper.find(".ol-scale").exists()).toBe(true);
    });

    it("does not render print scale", () => {
      const wrapper = mount(MapModule, { props: defaultProps() });
      expect(wrapper.find(".ol-scale-print").exists()).toBe(false);
    });
  });

  describe("displayMode: print", () => {
    it("renders scale print only", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps({ displayMode: "print" }),
      });
      expect(wrapper.find(".ol-scale-print").exists()).toBe(true);
      expect(wrapper.find(".ol-context-menu").exists()).toBe(false);
      expect(wrapper.find(".ol-mouse-tracker").exists()).toBe(false);
    });
  });

  describe("displayMode: embed", () => {
    it("renders scale only", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps({ displayMode: "embed" }),
      });
      expect(wrapper.find(".ol-scale").exists()).toBe(true);
      expect(wrapper.find(".ol-context-menu").exists()).toBe(false);
      expect(wrapper.find(".ol-mouse-tracker").exists()).toBe(false);
      expect(wrapper.find(".ol-scale-print").exists()).toBe(false);
    });
  });

  describe("compare slider", () => {
    it("shows slider when active and clipped layer provided", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps({
          compareSliderActive: true,
          compareSliderClippedLayer: makeLayer(),
        }),
      });
      expect(wrapper.find(".ol-compare-slider").exists()).toBe(true);
    });

    it("hides slider when inactive", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps({ compareSliderActive: false }),
      });
      expect(wrapper.find(".ol-compare-slider").exists()).toBe(false);
    });

    it("hides slider when no clipped layer", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps({ compareSliderActive: true }),
      });
      expect(wrapper.find(".ol-compare-slider").exists()).toBe(false);
    });
  });

  describe("update:compareRatio emit", () => {
    it("forwards emit from compare slider", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps({
          compareSliderActive: true,
          compareSliderClippedLayer: makeLayer(),
        }),
      });
      const slider = wrapper.findComponent(".ol-compare-slider") as VueWrapper;
      slider.vm.$emit("update:compareRatio", 0.75);
      expect(wrapper.emitted("update:compareRatio")).toEqual([[0.75]]);
    });
  });

  describe("slots", () => {
    it("passes default slot to OpenLayersMap", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps(),
        slots: { default: "<div class='slot-content'>Hello</div>" },
      });
      expect(wrapper.find(".slot-content").exists()).toBe(true);
    });

    it("passes context-menu-popup slot in web mode", () => {
      const wrapper = mount(MapModule, {
        props: defaultProps(),
        slots: {
          "context-menu-popup": "<div class='popup-content'>Menu</div>",
        },
      });
      expect(wrapper.find(".popup-content").exists()).toBe(true);
    });
  });
});
