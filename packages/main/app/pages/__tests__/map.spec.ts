import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import MapPage from "../map.vue";

const mocks = vi.hoisted(() => ({ route: vi.fn(), mapView: vi.fn() }));
const route = reactive({ meta: { datasetDetail: false } });
const mapView = reactive({
  isFullscreenModeActive: false,
  exitFullscreenMode: vi.fn(),
});

mockNuxtImport("useRoute", () => mocks.route);
mockNuxtImport("useMapViewStore", () => mocks.mapView);
mockNuxtImport("useSeoMeta", () => vi.fn());

function render() {
  return mount(MapPage, {
    attachTo: document.body,
    global: {
      stubs: {
        MapViewer: { template: '<div data-testid="map" />' },
        DatasetPanelFrame: {
          props: ["visible"],
          template: '<aside v-show="visible"><slot /></aside>',
        },
        NuxtPage: { template: '<div data-testid="route-outlet" />' },
      },
    },
  });
}

beforeEach(() => {
  mocks.route.mockReturnValue(route);
  mocks.mapView.mockReturnValue(mapView);
  mapView.exitFullscreenMode.mockClear();
  mapView.isFullscreenModeActive = false;
  route.meta.datasetDetail = false;
});

describe("map page", () => {
  it("keeps the map and route outlet mounted while details open and close", async () => {
    const wrapper = render();
    const map = wrapper.get('[data-testid="map"]').element;
    const outlet = wrapper.get('[data-testid="route-outlet"]').element;

    for (const visible of [true, false, true]) {
      route.meta.datasetDetail = visible;
      await nextTick();

      expect(wrapper.get("aside").isVisible()).toBe(visible);
      expect(wrapper.get('[data-testid="map"]').element).toBe(map);
      expect(wrapper.get('[data-testid="route-outlet"]').element).toBe(outlet);
      expect(map.parentElement).toBe(
        wrapper.get("aside").element.parentElement,
      );
    }

    wrapper.unmount();
  });

  it("exits fullscreen when details open", async () => {
    const wrapper = render();
    mapView.isFullscreenModeActive = true;
    route.meta.datasetDetail = true;
    await nextTick();

    expect(mapView.exitFullscreenMode).toHaveBeenCalledOnce();
    expect(wrapper.get("aside").isVisible()).toBe(false);

    mapView.isFullscreenModeActive = false;
    await nextTick();
    expect(wrapper.get("aside").isVisible()).toBe(true);

    wrapper.unmount();
  });
});
