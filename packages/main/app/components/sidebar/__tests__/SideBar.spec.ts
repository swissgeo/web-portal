import { mount } from "@vue/test-utils";
import SideBar from "~/components/sidebar/SideBar.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const { backgroundLayers, layerStore, sidebarState } = await vi.hoisted(
  async () => {
    const { ref } = await import("vue");
    return {
      backgroundLayers: ref([]),
      layerStore: {
        backgroundLayer: null,
        setBackground: vi.fn(),
      },
      sidebarState: {
        currentSidebar: "layerCart",
        isSidebarOpen: true,
      },
    };
  },
);

vi.mock("@swissgeo/skeleton", () => ({
  SIDEBAR_CONTENT_WIDTH: 347,
  SIDEBAR_HANDLE_WIDTH: 32,
  SIDEBAR_PANEL_WIDTH: 315,
  SidebarType: {
    LAYER_CART: "layerCart",
  },
  useSidebarStore: () => sidebarState,
}));

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
}));

vi.mock("~/composables/useBackgroundLayers", () => ({
  useBackgroundLayers: () => ({ backgroundLayers }),
}));

describe("SideBar", () => {
  beforeEach(() => {
    sidebarState.currentSidebar = "layerCart";
    sidebarState.isSidebarOpen = true;
  });

  it("renders the exact Figma panel width", () => {
    const wrapper = mount(SideBar, {
      props: {
        mapLayers: ref([]),
      },
      global: {
        stubs: {
          LayerCart: true,
          SidebarIcons: true,
        },
      },
    });

    expect(
      wrapper.get('[data-testid="sidebar-panel"]').attributes("style"),
    ).toContain("width: 347px");
    expect(
      wrapper.get('[data-testid="sidebar-panel-content"]').attributes("style"),
    ).toContain("width: 315px");
    expect(
      wrapper.get('[data-testid="sidebar-panel-handle"]').attributes("style"),
    ).toContain("width: 32px");
    expect(
      wrapper
        .get('[data-testid="sidebar-panel-handle"]')
        .attributes("aria-hidden"),
    ).toBe("true");
  });

  it("renders layer content only for the active layer panel", () => {
    sidebarState.currentSidebar = "closed";
    const wrapper = mount(SideBar, {
      props: {
        mapLayers: ref([]),
      },
      global: {
        stubs: {
          LayerCart: true,
          SidebarIcons: true,
        },
      },
    });

    expect(wrapper.find("layer-cart-stub").exists()).toBe(false);
  });

  it("keeps the mobile background selector on map routes", () => {
    const wrapper = mount(SideBar, {
      props: {
        mapLayers: ref([]),
        showMapControls: true,
      },
      global: {
        stubs: {
          LayerCart: true,
          MapBackgroundSelectorRounded: true,
          SidebarIcons: true,
        },
      },
    });

    expect(wrapper.find("map-background-selector-rounded-stub").exists()).toBe(
      true,
    );
  });
});
