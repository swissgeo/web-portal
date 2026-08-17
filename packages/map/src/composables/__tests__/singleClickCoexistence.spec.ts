import type { Map as OlMap } from "ol";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";

import type { MapClickEvent } from "@/types";

import { useMapClickEvent } from "../useMapClickEvent.composable";
import { useOlMapContextMenu } from "../useOlMapContextMenu.composable";
import { createFakeOlMap } from "./__mocks__/composables";

const LEFT_CLICK_COORDINATE: [number, number] = [2600000, 1200000];
const LEFT_CLICK_PIXEL: [number, number] = [100, 200];

/**
 * Mounts both single-click consumers (the feature-info click handler and the
 * context menu) against ONE shared fake map, exactly like MapModule does in
 * web mode: both inject "olMap" and register their own "singleclick" listener
 * on the same OL instance.
 */
function setup() {
  const onClick = vi.fn();
  // one stable viewport element: the context menu attaches "contextmenu" to
  // whatever getViewport() returns, so it must return the same element twice
  const viewport = document.createElement("div");

  const { fakeMap } = createFakeOlMap({
    view: { getResolution: vi.fn(() => 1) },
    map: {
      getViewport: () => viewport,
      getEventPixel: vi.fn(() => [100, 200]),
      getCoordinateFromPixel: vi.fn(() => [2660000, 1190000]),
    },
  });

  const contextMenuRef: { current: ReturnType<typeof useOlMapContextMenu> } = {
    current: undefined as unknown as ReturnType<typeof useOlMapContextMenu>,
  };

  const TestComponent = defineComponent({
    setup() {
      contextMenuRef.current = useOlMapContextMenu();
      useMapClickEvent(onClick);
      return {};
    },
    template: "<div />",
  });

  const wrapper = mount(TestComponent, {
    global: {
      provide: { olMap: ref(fakeMap as unknown as OlMap) },
    },
  });

  const contextMenu = contextMenuRef.current;

  const singleClickHandlers = () =>
    fakeMap.on.mock.calls
      .filter(([evt]) => evt === "singleclick")
      .map(
        ([, handler]) =>
          handler as (_olEvent: {
            coordinate: number[];
            pixel: number[];
          }) => void,
      );

  /** OL dispatches one singleclick event; every registered listener sees it. */
  const fireLeftClick = () => {
    const handlers = singleClickHandlers();
    expect(handlers.length).toBeGreaterThan(0);
    for (const handler of handlers) {
      handler({ coordinate: LEFT_CLICK_COORDINATE, pixel: LEFT_CLICK_PIXEL });
    }
  };

  const fireRightClick = () => {
    const evt = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    viewport.dispatchEvent(evt);
    return evt;
  };

  return {
    wrapper,
    fakeMap,
    contextMenu,
    onClick,
    fireLeftClick,
    fireRightClick,
    singleClickHandlers,
  };
}

describe("singleclick coexistence — useMapClickEvent + useOlMapContextMenu", () => {
  it("registers one singleclick listener per composable on the shared map", () => {
    const { singleClickHandlers } = setup();

    expect(singleClickHandlers()).toHaveLength(2);
  });

  it("right click opens the context popup without emitting map-click", () => {
    const { contextMenu, onClick, fireRightClick } = setup();

    const evt = fireRightClick();

    expect(evt.defaultPrevented).toBe(true);
    expect(contextMenu.isVisible.value).toBe(true);
    expect(contextMenu.coordinate.value).toEqual([2660000, 1190000]);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("a left click after a right click closes the popup AND emits map-click (both signals)", () => {
    const { contextMenu, onClick, fireRightClick, fireLeftClick } = setup();

    fireRightClick();
    expect(contextMenu.isVisible.value).toBe(true);

    fireLeftClick();

    // both consumers handled the same OL singleclick event
    expect(contextMenu.isVisible.value).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
    const event = onClick.mock.calls[0]![0] as MapClickEvent;
    expect(event.coordinate).toEqual(LEFT_CLICK_COORDINATE);
    expect(event.pixel).toEqual(LEFT_CLICK_PIXEL);
    // popup being open must not alter the click payload (resolution 1 → ±10)
    expect(event.extent).toEqual([2599990, 1199990, 2600010, 1200010]);
  });

  it("a left click without a prior right click emits map-click and stays closed", () => {
    const { contextMenu, onClick, fireLeftClick } = setup();

    fireLeftClick();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(contextMenu.isVisible.value).toBe(false);
  });

  it("a second right click re-anchors the popup and still emits no map-click", () => {
    const { contextMenu, onClick, fireRightClick, fireLeftClick } = setup();

    fireRightClick();
    fireLeftClick();
    expect(contextMenu.isVisible.value).toBe(false);

    fireRightClick();

    expect(contextMenu.isVisible.value).toBe(true);
    expect(contextMenu.coordinate.value).toEqual([2660000, 1190000]);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("unmount removes both singleclick listeners from the shared map", () => {
    const { wrapper, fakeMap, singleClickHandlers } = setup();
    const handlers = singleClickHandlers();

    wrapper.unmount();

    for (const handler of handlers) {
      expect(fakeMap.un).toHaveBeenCalledWith("singleclick", handler);
    }
  });
});
