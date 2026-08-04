import type { Map as OlMap } from "ol";
import type { Extent } from "ol/extent";

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

import { useMap } from "@/composables/useMap.composable";
import { useMapStore } from "@/stores/map";

type EventHandler = () => void;

interface ViewState {
  center: [number, number];
  extent: Extent;
  zoom: number;
}

async function mountHarness() {
  const state: ViewState = {
    center: [2600000, 1200000],
    extent: [2590000, 1190000, 2610000, 1210000],
    zoom: 4,
  };
  const mapHandlers = new Map<string, EventHandler>();
  const viewHandlers = new Map<string, EventHandler>();
  const view = {
    calculateExtent: vi.fn(() => state.extent),
    getCenter: () => state.center,
    getZoom: () => state.zoom,
    on: (event: string, handler: EventHandler) => {
      viewHandlers.set(event, handler);
    },
  };
  const map = {
    getSize: () => [800, 600],
    getView: () => view,
    on: (event: string, handler: EventHandler) => {
      mapHandlers.set(event, handler);
    },
  };

  let mapState!: ReturnType<typeof useMap>;
  const wrapper = mount(
    defineComponent({
      setup() {
        mapState = useMap();
        return () => h("div");
      },
    }),
  );

  useMapStore().setOlMap(map as unknown as OlMap);
  await nextTick();

  return { mapHandlers, mapState, state, view, viewHandlers, wrapper };
}

describe("useMap", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("reads the initial view state when the map becomes available", async () => {
    const { mapState, state, view, wrapper } = await mountHarness();

    expect(mapState.zoomLevel.value).toBe(state.zoom);
    expect(mapState.center.value).toEqual(state.center);
    expect(mapState.viewportExtent.value).toEqual(state.extent);
    expect(view.calculateExtent).toHaveBeenCalledWith([800, 600]);

    wrapper.unmount();
  });

  it("updates zoom, center, and extent from view changes", async () => {
    const { mapState, state, viewHandlers, wrapper } = await mountHarness();

    state.zoom = 7;
    viewHandlers.get("change:resolution")?.();

    state.center = [2600100, 1200200];
    state.extent = [2590100, 1190200, 2610100, 1210200];
    viewHandlers.get("change:center")?.();

    expect(mapState.zoomLevel.value).toBe(7);
    expect(mapState.center.value).toEqual([2600100, 1200200]);
    expect(mapState.viewportExtent.value).toEqual(state.extent);

    wrapper.unmount();
  });

  it("updates center and extent during a pointer drag", async () => {
    const { mapHandlers, mapState, state, wrapper } = await mountHarness();

    state.center = [2600300, 1200400];
    state.extent = [2590300, 1190400, 2610300, 1210400];
    mapHandlers.get("pointerdrag")?.();

    expect(mapState.center.value).toEqual([2600300, 1200400]);
    expect(mapState.viewportExtent.value).toEqual(state.extent);

    wrapper.unmount();
  });
});
