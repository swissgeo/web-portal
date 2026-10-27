import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import SideBar from "~/components/sidebar/SideBar.vue";
import { panelSnapPointKey } from "~/types/injectionKeys";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

const { sidebar, isDesktop } = await vi.hoisted(async () => {
  const { reactive, ref } = await import("vue");
  const sidebar = reactive({
    isSidebarOpen: true,
    currentSidebar: "layerCart" as string | null,
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

// The shared isDesktop ref keeps every mounted SideBar's watcher alive, so
// components must not leak across tests
const mounted: ReturnType<typeof mount>[] = [];

function mountSideBar(
  isVisible?: boolean,
  panelSnapPoint = ref<number | string | null>(null),
) {
  const wrapper = mount(SideBar, {
    props: { mapLayers: ref([]), isVisible },
    global: {
      provide: { [panelSnapPointKey]: panelSnapPoint },
      stubs: {
        LayerCart: true,
        LayerCatalog: true,
        ResponsivePanel: {
          name: "ResponsivePanel",
          props: ["title", "closeLabel", "isVisible", "hasHeader"],
          emits: ["close"],
          template: "<section><slot /><slot name='footer' /></section>",
        },
        USeparator: true,
        BackgroundSelector: true,
      },
    },
  });
  mounted.push(wrapper);
  return wrapper;
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.unmount();
  }
});

describe("SideBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sidebar.isSidebarOpen = true;
    sidebar.currentSidebar = "layerCart";
    sidebar.sidebarContentWidth = 320;
    isDesktop.value = true;
  });

  describe("always-open desktop sidebar", () => {
    it("opens the layer cart when the desktop sidebar has no panel", () => {
      sidebar.currentSidebar = null;

      mountSideBar();

      expect(sidebar.setSidebar).toHaveBeenCalledExactlyOnceWith("layerCart");
    });

    it("keeps the open panel when remounting, for example after leaving the fullscreen mode", () => {
      sidebar.currentSidebar = "geocatalogTree";

      mountSideBar();

      expect(sidebar.setSidebar).not.toHaveBeenCalled();
    });

    it("does not open a panel on mobile, the footer opens them there", () => {
      isDesktop.value = false;
      sidebar.currentSidebar = null;

      mountSideBar();

      expect(sidebar.setSidebar).not.toHaveBeenCalled();
    });

    it("opens the layer cart when the viewport grows to desktop", async () => {
      isDesktop.value = false;
      sidebar.currentSidebar = null;
      mountSideBar();
      vi.clearAllMocks();

      isDesktop.value = true;
      await nextTick();

      expect(sidebar.setSidebar).toHaveBeenCalledExactlyOnceWith("layerCart");
    });

    it("closes the sidebar when the viewport shrinks to mobile", async () => {
      mountSideBar();
      vi.clearAllMocks();

      isDesktop.value = false;
      await nextTick();

      expect(sidebar.closeSidebar).toHaveBeenCalledOnce();
    });
  });

  it("closes the sidebar on mobile when the layer catalog is closed", () => {
    isDesktop.value = false;
    sidebar.currentSidebar = "geocatalogTree";
    const wrapper = mountSideBar();
    // Mounting on mobile already closes the sidebar once
    vi.clearAllMocks();

    wrapper.getComponent({ name: "ResponsivePanel" }).vm.$emit("close");

    expect(sidebar.closeSidebar).toHaveBeenCalledOnce();
    expect(sidebar.setSidebar).not.toHaveBeenCalled();
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
      // On mobile the cart and the catalog are bottom drawers, not part of the sidebar
      [false, "layerCart", false],
      [false, "geocatalogTree", false],
    ])(
      "with desktop=%s and %s open is visible=%s",
      (desktop, currentSidebar, visible) => {
        isDesktop.value = desktop;
        sidebar.currentSidebar = currentSidebar;

        expect(isContentVisible(mountSideBar())).toBe(visible);
      },
    );

    it("stays visible on desktop while no panel is open", () => {
      sidebar.currentSidebar = null;
      sidebar.isSidebarOpen = false;

      expect(isContentVisible(mountSideBar())).toBe(true);
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

  it("keeps the cart in a panel on desktop too, so it survives a rotation, with the background selector below it", () => {
    const wrapper = mountSideBar();
    const panel = wrapper.getComponent({ name: "ResponsivePanel" });

    expect(panel.props("hasHeader")).toBe(false);
    expect(panel.findComponent({ name: "LayerCart" }).exists()).toBe(true);
    expect(panel.findComponent({ name: "BackgroundSelector" }).exists()).toBe(
      false,
    );
    expect(
      wrapper.findAllComponents({ name: "BackgroundSelector" }),
    ).toHaveLength(1);
  });

  describe("layer cart on mobile", () => {
    beforeEach(() => {
      isDesktop.value = false;
    });

    it("opens the map panel partially, also after a fully open catalog", async () => {
      sidebar.currentSidebar = "geocatalogTree";
      const panelSnapPoint = ref<number | string | null>(1);
      mountSideBar(true, panelSnapPoint);

      sidebar.currentSidebar = "layerCart";
      await nextTick();

      expect(panelSnapPoint.value).toBeNull();
    });

    it("shows the cart and a background selector in a panel without its own header", () => {
      const wrapper = mountSideBar();
      const panel = wrapper.getComponent({ name: "ResponsivePanel" });

      expect(panel.props("title")).toBe("menu.map");
      expect(panel.props("hasHeader")).toBe(false);
      expect(panel.findComponent({ name: "LayerCart" }).exists()).toBe(true);
      expect(panel.findComponent({ name: "BackgroundSelector" }).exists()).toBe(
        true,
      );
    });

    it("keeps a background selector mounted while no panel is open, so the default background loads", () => {
      sidebar.isSidebarOpen = false;
      sidebar.currentSidebar = null;

      expect(
        mountSideBar().findComponent({ name: "BackgroundSelector" }).exists(),
      ).toBe(true);
    });

    it("closes the sidebar when the cart panel is closed", () => {
      const wrapper = mountSideBar();
      // Mounting on mobile already closes the sidebar once
      vi.clearAllMocks();

      wrapper.getComponent({ name: "ResponsivePanel" }).vm.$emit("close");

      expect(sidebar.closeSidebar).toHaveBeenCalledOnce();
    });

    it("hides the cart panel while a dataset is open", () => {
      expect(
        mountSideBar(false)
          .getComponent({ name: "ResponsivePanel" })
          .props("isVisible"),
      ).toBe(false);
    });
  });

  it("hides itself and its teleported catalog panel without removing them", () => {
    sidebar.currentSidebar = "geocatalogTree";

    const wrapper = mountSideBar(false);

    expect((wrapper.element as HTMLElement).style.display).toBe("none");
    expect(
      wrapper.getComponent({ name: "ResponsivePanel" }).props("isVisible"),
    ).toBe(false);
  });

  it("sizes the content to the width the store provides", async () => {
    const wrapper = mountSideBar();
    const content = wrapper.get("div[style*='width']");
    expect(content.attributes("style")).toContain("width: 320px");

    sidebar.sidebarContentWidth = 1280;
    await wrapper.vm.$nextTick();

    expect(content.attributes("style")).toContain("width: 1280px");
  });

  it("shows the layer catalog as an overlay without widening the column", async () => {
    const wrapper = mountSideBar();
    const content = wrapper.get("div[style*='width']");

    sidebar.currentSidebar = "geocatalogTree";
    await wrapper.vm.$nextTick();

    const overlay = wrapper.get("[data-testid='layer-catalog-overlay']");
    expect(overlay.classes()).toContain("absolute");
    expect(overlay.findComponent({ name: "LayerCatalog" }).exists()).toBe(true);
    expect(content.attributes("style")).toContain("width: 320px");
  });

  it("shows the background selector only with the map panel, but keeps it mounted", async () => {
    const wrapper = mountSideBar();
    const selectorBox = () =>
      wrapper.get<HTMLElement>("[data-testid='sidebar-background-selector']")
        .element;
    expect(selectorBox().style.display).toBe("");

    sidebar.currentSidebar = "geocatalogTree";
    await wrapper.vm.$nextTick();

    expect(selectorBox().style.display).toBe("none");
  });
});
