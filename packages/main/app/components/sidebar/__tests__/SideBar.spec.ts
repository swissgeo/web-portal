import { mount } from "@vue/test-utils";
import SideBar from "~/components/sidebar/SideBar.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const { sidebar } = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  const sidebar = reactive({
    isSidebarOpen: true,
    currentSidebar: "layerCart",
    closeSidebar: vi.fn(),
    setSidebar: vi.fn(),
  });
  return { sidebar };
});

vi.mock("@swissgeo/skeleton", () => ({
  useSidebarStore: () => sidebar,
  SidebarType: { LAYER_CART: "layerCart" },
  SIDEBAR_CONTENT_WIDTH: 347,
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("SideBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sidebar.isSidebarOpen = true;
    sidebar.currentSidebar = "layerCart";
  });

  it("keeps the collapse label and icon in sync with the sidebar state", async () => {
    const wrapper = mount(SideBar, {
      props: { mapLayers: ref([]) },
      global: {
        stubs: {
          LayerCart: true,
          UButton: { name: "UButton", props: ["icon"], template: "<button />" },
        },
      },
    });
    const button = wrapper.get("button");
    const control = wrapper.getComponent({ name: "UButton" });

    expect(button.attributes("aria-label")).toBe("menu.collapse");
    expect(control.props("icon")).toBe("i-lucide-chevron-left");
    await button.trigger("click");
    expect(sidebar.closeSidebar).toHaveBeenCalledOnce();

    sidebar.isSidebarOpen = false;
    await wrapper.vm.$nextTick();
    expect(button.attributes("aria-label")).toBe("menu.expand");
    expect(control.props("icon")).toBe("i-lucide-chevron-right");
    await button.trigger("click");
    expect(sidebar.setSidebar).toHaveBeenCalledExactlyOnceWith("layerCart");
  });
});
