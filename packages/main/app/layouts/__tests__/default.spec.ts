import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DefaultLayout from "../default.vue";

const { panel, sidebar, route, mapView } = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  const panel = reactive({
    isOpen: false,
    activeDatasetId: "example",
    closeDatasetPanel() {
      this.isOpen = false;
    },
  });
  const sidebar = reactive({
    isGeocatalogTreeVisible: true,
    closeSidebar() {
      this.isGeocatalogTreeVisible = false;
    },
  });
  return {
    panel,
    sidebar,
    route: reactive({ path: "/de/map", name: "map___de" }),
    mapView: {
      isFullscreenModeActive: false,
      getMapLayers: () => [],
      exitFullscreenMode: vi.fn(),
    },
  };
});

vi.mock("@swissgeo/skeleton", () => ({
  useDatasetPanelStore: () => panel,
  useSidebarStore: () => sidebar,
}));
mockNuxtImport("useRoute", () => () => route);
mockNuxtImport("useResetApp", () => () => ({ resetApp: vi.fn() }));
mockNuxtImport("useMapViewStore", () => () => mapView);
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);

function render() {
  return mount(DefaultLayout, {
    attachTo: document.body,
    slots: { default: '<div data-testid="map-instance" />' },
    global: {
      stubs: {
        Topbar: true,
        UMain: { template: "<div><slot /></div>" },
        SideBar: {
          template:
            '<div data-testid="catalog"><input value="saved filter" /></div>',
        },
        DatasetPanel: {
          props: ["backToCatalog"],
          emits: ["back", "close"],
          template:
            '<section><button data-testid="back" @click="$emit(\'back\')">Back</button><button data-testid="close" @click="$emit(\'close\')">Close</button></section>',
        },
      },
    },
  });
}

beforeEach(() => {
  document.body.innerHTML = "";
  panel.isOpen = false;
  sidebar.isGeocatalogTreeVisible = true;
  route.path = "/de/map";
  route.name = "map___de";
});

describe("in-app dataset layout", () => {
  it("keeps map and catalog mounted while details open and Back restores the catalog", async () => {
    const wrapper = render();
    const map = wrapper.get('[data-testid="map-instance"]').element;
    const catalog = wrapper.get('[data-testid="catalog"]').element;
    await wrapper.get("input").setValue("retained filter");
    panel.isOpen = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="map-instance"]').element).toBe(map);
    expect(wrapper.get('[data-testid="catalog"]').element).toBe(catalog);
    expect(wrapper.get('[data-testid="catalog"]').isVisible()).toBe(false);
    await wrapper.get('[data-testid="back"]').trigger("click");
    expect(wrapper.get('[data-testid="catalog"]').isVisible()).toBe(true);
    expect(wrapper.get("input").element.value).toBe("retained filter");
    expect(sidebar.isGeocatalogTreeVisible).toBe(true);
    expect(wrapper.get('[data-testid="map-instance"]').element).toBe(map);
  });

  it("closes the catalog and details with X", async () => {
    panel.isOpen = true;
    const wrapper = render();
    await wrapper.get('[data-testid="close"]').trigger("click");
    expect(panel.isOpen).toBe(false);
    expect(sidebar.isGeocatalogTreeVisible).toBe(false);
    expect(wrapper.find('[data-testid="close"]').exists()).toBe(false);
  });

  it("does not show a stale map panel on the standalone dataset page", () => {
    panel.isOpen = true;
    route.path = "/de/dataset/example";
    route.name = "dataset-id___de";
    expect(render().find('[data-testid="close"]').exists()).toBe(false);
  });
});
