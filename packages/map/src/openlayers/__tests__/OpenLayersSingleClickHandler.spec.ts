import type { Map as OlMap } from "ol";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import type { MapClickEvent } from "@/types";

import { createFakeOlMap } from "../../composables/__tests__/__mocks__/composables";
import OpenLayersSingleClickHandler from "../OpenLayersSingleClickHandler.vue";

const CLICK_COORDINATE: [number, number] = [2600000, 1200000];
const CLICK_PIXEL: [number, number] = [100, 200];

function setup() {
  const { fakeMap } = createFakeOlMap({
    view: { getResolution: vi.fn(() => 1) },
  });

  const wrapper = mount(OpenLayersSingleClickHandler, {
    global: {
      provide: { olMap: ref(fakeMap as unknown as OlMap) },
    },
  });

  const getSingleClickHandler = () =>
    fakeMap.on.mock.calls.find(([evt]) => evt === "singleclick")?.[1] as
      | ((_olEvent: { coordinate: number[]; pixel: number[] }) => void)
      | undefined;

  const fireClick = () => {
    const handler = getSingleClickHandler();
    expect(handler).toBeInstanceOf(Function);
    handler!({ coordinate: CLICK_COORDINATE, pixel: CLICK_PIXEL });
  };

  return { wrapper, fakeMap, fireClick, getSingleClickHandler };
}

describe("OpenLayersSingleClickHandler", () => {
  it("registers a singleclick listener on the injected map", () => {
    const { fakeMap } = setup();

    expect(fakeMap.on).toHaveBeenCalledWith(
      "singleclick",
      expect.any(Function),
    );
  });

  it("re-emits the normalized click as a map-click event", () => {
    const { wrapper, fireClick } = setup();

    fireClick();

    const emitted = wrapper.emitted<[MapClickEvent]>("map-click");
    expect(emitted).toHaveLength(1);
    expect(emitted![0]![0]).toEqual({
      coordinate: CLICK_COORDINATE,
      pixel: CLICK_PIXEL,
      // resolution 1 → half box of 10px
      extent: [2599990, 1199990, 2600010, 1200010],
      viewportSize: [1000, 1000],
      vectorFeaturesPerLayer: {},
    });
  });

  it("unregisters the listener on unmount", () => {
    const { wrapper, fakeMap, getSingleClickHandler } = setup();
    const handler = getSingleClickHandler();

    wrapper.unmount();

    expect(fakeMap.un).toHaveBeenCalledWith("singleclick", handler);
  });
});
