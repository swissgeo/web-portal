import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import SideBar from "~/components/sidebar/SideBar.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const { sidebar, isDesktop } = await vi.hoisted(async () => {
  const { reactive, ref } = await import("vue");
  const sidebar = reactive({
    isSidebarOpen: true,
    currentSidebar: "layerCart",
    sidebarContentWidth: 320,
    closeSidebar: vi.fn(),
    setSidebar: vi.fn(),
  });
  return { sidebar, isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);

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
        ResponsivePanel: {
          name: "ResponsivePanel",
          props: ["title", "closeLabel"],
          emits: ["close"],
          template: "<section><slot /></section>",
        },
        UButton: { name: "UButton", props: ["icon"], template: "<button />" },
        USeparator: true,
        BackgroundSelector: true,
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
    isDesktop.value = true;
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

  it("shows the layer catalog in a titled panel", () => {
    sidebar.currentSidebar = "geocatalogTree";

    const panel = mountSideBar().getComponent({ name: "ResponsivePanel" });

    expect(panel.props("title")).toBe("layerCatalog.title");
    expect(panel.props("closeLabel")).toBe("layerCatalog.close");
    expect(panel.findComponent({ name: "LayerCatalog" }).exists()).toBe(true);
  });

  it("goes back to the layer cart when the layer catalog is closed", () => {
    sidebar.currentSidebar = "geocatalogTree";

    mountSideBar().getComponent({ name: "ResponsivePanel" }).vm.$emit("close");

    expect(sidebar.setSidebar).toHaveBeenCalledExactlyOnceWith("layerCart");
  });

  describe("sidebar content visibility", () => {
    function isContentVisible(wrapper: ReturnType<typeof mountSideBar>) {
      const content = wrapper.get("div[style*='width']").element as HTMLElement;
      return content.style.display !== "none";
    }

    it.each([
      [true, "layerCart", true],
      [true, "geocatalogTree", true],
      [false, "layerCart", true],
      // On mobile the catalog is a bottom sheet, not part of the sidebar
      [false, "geocatalogTree", false],
    ])(
      "with desktop=%s and %s open is visible=%s",
      (desktop, currentSidebar, visible) => {
        isDesktop.value = desktop;
        sidebar.currentSidebar = currentSidebar;

        expect(isContentVisible(mountSideBar())).toBe(visible);
      },
    );

    it("is hidden when the sidebar is closed", () => {
      sidebar.isSidebarOpen = false;

      expect(isContentVisible(mountSideBar())).toBe(false);
    });

    it("keeps the catalog mounted on mobile, so its bottom sheet shows", () => {
      isDesktop.value = false;
      sidebar.currentSidebar = "geocatalogTree";

      const wrapper = mountSideBar();

      expect(wrapper.findComponent({ name: "LayerCatalog" }).exists()).toBe(
        true,
      );
    });
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
