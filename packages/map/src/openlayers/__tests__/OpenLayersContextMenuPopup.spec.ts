import type { Map as OlMap } from "ol";

import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import OpenLayersContextMenuPopup from "../OpenLayersContextMenuPopup.vue";

const { overlay, menu } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    overlay: {
      setPositioning: vi.fn(),
      setOffset: vi.fn(),
      setPosition: vi.fn(),
    },
    menu: {
      isVisible: ref(false),
      coordinate: ref<[number, number] | null>(null),
      close: vi.fn(),
    },
  };
});

vi.mock("ol/Overlay", () => ({
  default: vi.fn(function () {
    return overlay;
  }),
}));
vi.mock("../../composables/useOlMapContextMenu.composable", () => ({
  useOlMapContextMenu: () => menu,
}));

// A 375 × 700 map with a 343px wide popup
function openAt(pixel: [number, number]) {
  const map = {
    addOverlay: vi.fn(),
    removeOverlay: vi.fn(),
    getPixelFromCoordinate: () => pixel,
    getSize: () => [375, 700],
  };
  mount(OpenLayersContextMenuPopup, {
    global: { provide: { olMap: ref(map as unknown as OlMap) } },
  });
  menu.coordinate.value = [2600000, 1200000];
  menu.isVisible.value = true;
  return nextTick();
}

Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get: () => 343,
});

enableAutoUnmount(afterEach);

describe("OpenLayersContextMenuPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    menu.isVisible.value = false;
    menu.coordinate.value = null;
  });

  it("opens below a point in the upper half of the map", async () => {
    await openAt([187.5, 200]);

    expect(overlay.setPositioning).toHaveBeenLastCalledWith("top-center");
    expect(overlay.setOffset).toHaveBeenLastCalledWith([0, 10]);
    expect(overlay.setPosition).toHaveBeenLastCalledWith([2600000, 1200000]);
  });

  it("opens above a point in the lower half and shifts away from the edge", async () => {
    await openAt([360, 600]);

    expect(overlay.setPositioning).toHaveBeenLastCalledWith("bottom-center");
    // 375 - 16 margin - 171.5 half width - 360
    expect(overlay.setOffset).toHaveBeenLastCalledWith([-172.5, -10]);
  });

  it("shifts right near the left edge", async () => {
    await openAt([10, 200]);

    // 16 margin + 171.5 half width - 10
    expect(overlay.setOffset).toHaveBeenLastCalledWith([177.5, 10]);
  });

  it("hides the popup when the menu closes", async () => {
    await openAt([187.5, 200]);
    menu.isVisible.value = false;
    await nextTick();

    expect(overlay.setPosition).toHaveBeenLastCalledWith(undefined);
  });
});
