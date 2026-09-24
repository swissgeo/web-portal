import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";

import DefaultLayout from "../default.vue";

const mocks = vi.hoisted(() => ({ route: vi.fn(), mapView: vi.fn() }));
const route = reactive({ path: "/de/map", name: "map___de" });
const mapView = reactive({
  isFullscreenModeActive: false,
  getMapLayers: () => [],
  exitFullscreenMode: vi.fn(),
});
mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));
mockNuxtImport("useRoute", () => mocks.route);
mockNuxtImport("useResetApp", () => () => ({ resetApp: vi.fn() }));
mockNuxtImport("useMapViewStore", () => mocks.mapView);

function render() {
  return mount(DefaultLayout, {
    attachTo: document.body,
    slots: {
      default: '<div data-testid="map-instance" />',
      details: '<section data-testid="details" />',
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        ClientOnly: { template: "<slot />" },
        Topbar: true,
        Footer: true,
        UDrawer: { template: '<div><slot name="content" /></div>' },
        UMain: { template: "<div><slot /></div>" },
        SideBar: {
          template:
            '<div data-testid="catalog"><input value="saved filter" /></div>',
        },
      },
    },
  });
}

beforeEach(() => {
  mocks.route.mockReturnValue(route);
  mocks.mapView.mockReturnValue(mapView);
  mapView.exitFullscreenMode.mockClear();
  mapView.isFullscreenModeActive = false;
  route.path = "/de/map";
  route.name = "map___de";
});

describe("application frame detail slot", () => {
  it("keeps page content and catalog state while details open and close", async () => {
    const wrapper = render();
    const map = wrapper.get('[data-testid="map-instance"]').element;
    const catalog = wrapper.get('[data-testid="catalog"]').element;
    await wrapper.get("input").setValue("retained filter");
    await wrapper.setProps({ detailsOpen: true });
    expect(wrapper.get('[data-testid="map-instance"]').element).toBe(map);
    expect(wrapper.get('[data-testid="catalog"]').element).toBe(catalog);
    expect(wrapper.get('[data-testid="catalog"]').isVisible()).toBe(false);
    expect(wrapper.find('[data-testid="details"]').exists()).toBe(true);
    await wrapper.setProps({ detailsOpen: false });
    expect(wrapper.get('[data-testid="catalog"]').isVisible()).toBe(true);
    expect(wrapper.get("input").element.value).toBe("retained filter");
    expect(wrapper.get('[data-testid="map-instance"]').element).toBe(map);
    expect(wrapper.get('[data-testid="details"]').isVisible()).toBe(false);
    wrapper.unmount();
  });

  it("exits map fullscreen when navigating to content", async () => {
    const wrapper = render();
    mapView.isFullscreenModeActive = true;
    route.path = "/de/page";
    route.name = "page___de";
    await wrapper.vm.$nextTick();
    expect(mapView.exitFullscreenMode).toHaveBeenCalled();
    wrapper.unmount();
  });
});
