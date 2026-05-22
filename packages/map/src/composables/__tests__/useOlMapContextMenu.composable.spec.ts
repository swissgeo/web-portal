import type { Map as OlMap } from "ol";

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";

import { useOlMapContextMenu } from "../useOlMapContextMenu.composable";

const LONG_PRESS_DELAY = 500;

type FakeMap = {
  viewport: HTMLDivElement;
  getViewport: () => HTMLDivElement;
  getEventPixel: ReturnType<typeof vi.fn>;
  getCoordinateFromPixel: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  un: ReturnType<typeof vi.fn>;
};

function createFakeMap(): FakeMap {
  const viewport = document.createElement("div");
  return {
    viewport,
    getViewport: () => viewport,
    getEventPixel: vi.fn(() => [100, 200]),
    getCoordinateFromPixel: vi.fn(() => [6.5, 46.5]),
    on: vi.fn(),
    un: vi.fn(),
  };
}

function mountWithMap(fakeMap: FakeMap) {
  let composable: ReturnType<typeof useOlMapContextMenu>;

  const TestComponent = defineComponent({
    setup() {
      composable = useOlMapContextMenu();
      return composable;
    },
    template: "<div />",
  });

  const wrapper = mount(TestComponent, {
    global: {
      provide: {
        olMap: ref(fakeMap as unknown as OlMap),
      },
    },
  });
  return { wrapper, composable: composable };
}

describe("useOlMapContextMenu", () => {
  let fakeMap: FakeMap;

  beforeEach(() => {
    fakeMap = createFakeMap();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("right-click (contextmenu)", () => {
    it("opens the popup and sets coordinate on contextmenu event", () => {
      const { composable } = mountWithMap(fakeMap);

      fakeMap.viewport.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true }),
      );

      expect(composable.isVisible.value).toBe(true);
      expect(composable.coordinate.value).toEqual([6.5, 46.5]);
    });

    it("prevents the default browser context menu", () => {
      mountWithMap(fakeMap);

      const evt = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      fakeMap.viewport.dispatchEvent(evt);

      expect(evt.defaultPrevented).toBe(true);
    });
  });

  describe("singleclick", () => {
    it("closes the popup on a map singleclick", () => {
      const { composable } = mountWithMap(fakeMap);

      // Open the popup first
      fakeMap.viewport.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true }),
      );
      expect(composable.isVisible.value).toBe(true);

      // Simulate OL firing singleclick by calling the registered handler directly
      const singleClickHandler = fakeMap.on.mock.calls.find(
        ([evt]) => evt === "singleclick",
      )?.[1];
      singleClickHandler?.();

      expect(composable.isVisible.value).toBe(false);
    });
  });

  describe("long press", () => {
    it("does not open the popup on a mouse long press", async () => {
      const { composable } = mountWithMap(fakeMap);

      fakeMap.viewport.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
        }),
      );
      await new Promise((r) => setTimeout(r, LONG_PRESS_DELAY + 100));

      expect(composable.isVisible.value).toBe(false);
    });

    it("opens the popup on a touch long press", async () => {
      const { composable } = mountWithMap(fakeMap);

      fakeMap.viewport.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "touch",
          clientX: 100,
          clientY: 200,
        }),
      );
      await new Promise((r) => setTimeout(r, LONG_PRESS_DELAY + 100));

      expect(composable.isVisible.value).toBe(true);
    });

    it("suppresses the singleclick that follows a touch long press", async () => {
      const { composable } = mountWithMap(fakeMap);

      // Trigger long press
      fakeMap.viewport.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "touch",
          clientX: 100,
          clientY: 200,
        }),
      );
      await new Promise((r) => setTimeout(r, LONG_PRESS_DELAY + 100));
      expect(composable.isVisible.value).toBe(true);

      // OL fires singleclick after the touch release, it should be suppressed
      const singleClickHandler = fakeMap.on.mock.calls.find(
        ([evt]) => evt === "singleclick",
      )?.[1];
      singleClickHandler?.();

      expect(composable.isVisible.value).toBe(true);

      // A subsequent singleclick (real tap elsewhere) should close it
      singleClickHandler?.();
      expect(composable.isVisible.value).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("unregisters all event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(
        fakeMap.viewport,
        "removeEventListener",
      );
      const { wrapper } = mountWithMap(fakeMap);

      wrapper.unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "contextmenu",
        expect.any(Function),
      );
      expect(fakeMap.un).toHaveBeenCalledWith(
        "singleclick",
        expect.any(Function),
      );
    });
  });
});
