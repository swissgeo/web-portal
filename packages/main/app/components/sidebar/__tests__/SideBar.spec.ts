import { mount } from "@vue/test-utils";
import SideBar from "~/components/sidebar/SideBar.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const { sidebarState } = vi.hoisted(() => ({
  sidebarState: {
    currentSidebar: "layerCart",
    isSidebarOpen: true,
  },
}));

vi.mock("@swissgeo/skeleton", () => ({
  SIDEBAR_CONTENT_WIDTH: 347,
  SidebarType: {
    LAYER_CART: "layerCart",
  },
  useSidebarStore: () => sidebarState,
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
});
