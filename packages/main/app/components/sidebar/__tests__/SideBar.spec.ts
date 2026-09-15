import { mount } from "@vue/test-utils";
import SideBar from "~/components/sidebar/SideBar.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const { sidebar } = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  const sidebar = reactive({
    isSidebarOpen: true,
    currentSidebar: "layerCart",
    sidebarContentWidth: 320,
    closeSidebar: vi.fn(),
    setSidebar: vi.fn(),
  });
  return { sidebar };
});

vi.mock("@swissgeo/skeleton", () => ({
  useSidebarStore: () => sidebar,
  SidebarType: { LAYER_CART: "layerCart", GEOCATALOG_TREE: "geocatalogTree" },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function mountSideBar() {
  return mount(SideBar, {
    props: { mapLayers: ref([]) },
    global: {
      stubs: {
        LayerCart: true,
        LayerCatalog: true,
        UButton: { name: "UButton", props: ["icon"], template: "<button />" },
      },
    },
  });
}

describe("SideBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sidebar.isSidebarOpen = true;
    sidebar.currentSidebar = "layerCart";
    sidebar.sidebarContentWidth = 320;
  });

  it("keeps the collapse label and icon in sync with the sidebar state", async () => {
    const wrapper = mountSideBar();
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

  it("shows the layer cart or the layer catalog, depending on the current sidebar", async () => {
    const wrapper = mountSideBar();
    expect(wrapper.findComponent({ name: "LayerCart" }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: "LayerCatalog" }).exists()).toBe(
      false,
    );

    sidebar.currentSidebar = "geocatalogTree";
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: "LayerCart" }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: "LayerCatalog" }).exists()).toBe(true);
  });

  it("sizes the content to the current sidebar", async () => {
    const wrapper = mountSideBar();
    const content = wrapper.get("div[style*='width']");
    expect(content.attributes("style")).toContain("width: 320px");

    sidebar.sidebarContentWidth = 1280;
    await wrapper.vm.$nextTick();

    expect(content.attributes("style")).toContain("width: 1280px");
  });
});
