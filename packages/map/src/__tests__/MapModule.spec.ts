import type { Map as OlMap } from "ol";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";

import type { MapClickEvent } from "@/types";

import { createFakeOlMap } from "../composables/__tests__/__mocks__/composables";
import MapModule from "../MapModule.vue";
import OpenLayersSingleClickHandler from "../openlayers/OpenLayersSingleClickHandler.vue";

const CLICK_COORDINATE: [number, number] = [2600000, 1200000];
const CLICK_PIXEL: [number, number] = [100, 200];

/**
 * Replaces OpenLayersMap: instead of creating a real OL map it provides the
 * fake one, so the children that inject "olMap" (the single-click handler in
 * these tests) run against a controllable double.
 */
const OpenLayersMapStub = defineComponent({
  name: "OpenLayersMap",
  setup() {
    return {};
  },
  template: "<div data-testid='ol-map'><slot /></div>",
});

function setup(displayMode: "web" | "print" | "embed") {
  const { fakeMap } = createFakeOlMap({
    view: { getResolution: vi.fn(() => 2) },
  });
  const olMapRef = ref(fakeMap as unknown as OlMap);

  const wrapper = mount(MapModule, {
    props: {
      displayMode,
      layers: [],
      customLayerRenderers: [],
    },
    global: {
      provide: { olMap: olMapRef },
      stubs: {
        OpenLayersMap: OpenLayersMapStub,
        OpenLayersContextMenuPopup: true,
        OpenLayersMouseTracker: true,
        OpenLayersScale: true,
        OpenLayersScalePrint: true,
        OpenLayersCompareSlider: true,
      },
    },
  });

  const singleClickRegistrations = () =>
    fakeMap.on.mock.calls.filter(([evt]) => evt === "singleclick");

  const fireClick = () => {
    const handler = singleClickRegistrations()[0]?.[1] as
      | ((_olEvent: { coordinate: number[]; pixel: number[] }) => void)
      | undefined;
    expect(handler).toBeInstanceOf(Function);
    handler!({ coordinate: CLICK_COORDINATE, pixel: CLICK_PIXEL });
  };

  return { wrapper, fakeMap, singleClickRegistrations, fireClick };
}

describe("MapModule — map-click per display mode", () => {
  it("renders the single-click handler and re-emits map-click in web mode", () => {
    const { wrapper, fireClick, singleClickRegistrations } = setup("web");

    expect(wrapper.findComponent(OpenLayersSingleClickHandler).exists()).toBe(
      true,
    );
    expect(singleClickRegistrations()).toHaveLength(1);

    fireClick();

    const emitted = wrapper.emitted<[MapClickEvent]>("map-click");
    expect(emitted).toHaveLength(1);
    const event = emitted![0]![0];
    expect(event.coordinate).toEqual(CLICK_COORDINATE);
    expect(event.pixel).toEqual(CLICK_PIXEL);
    // resolution 2 → half box of 20px
    expect(event.extent).toEqual([2599980, 1199980, 2600020, 1200020]);
  });

  it("renders the single-click handler and re-emits map-click in embed mode", () => {
    const { wrapper, fireClick, singleClickRegistrations } = setup("embed");

    expect(wrapper.findComponent(OpenLayersSingleClickHandler).exists()).toBe(
      true,
    );
    expect(singleClickRegistrations()).toHaveLength(1);

    fireClick();

    expect(wrapper.emitted("map-click")).toHaveLength(1);
  });

  it("does not render the single-click handler nor emit map-click in print mode", () => {
    const { wrapper, singleClickRegistrations } = setup("print");

    expect(wrapper.findComponent(OpenLayersSingleClickHandler).exists()).toBe(
      false,
    );
    expect(singleClickRegistrations()).toHaveLength(0);
    expect(wrapper.emitted("map-click")).toBeUndefined();
  });

  it("renders the print scale instead of the web scale in print mode", () => {
    const web = setup("web");
    const print = setup("print");

    expect(
      web.wrapper.findComponent({ name: "OpenLayersScalePrint" }).exists(),
    ).toBe(false);
    expect(
      print.wrapper.findComponent({ name: "OpenLayersScalePrint" }).exists(),
    ).toBe(true);
  });
});
