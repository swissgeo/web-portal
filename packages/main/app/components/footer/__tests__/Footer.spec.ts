import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { mount } from "@vue/test-utils";
import Footer from "~/components/footer/Footer.vue";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isDesktop, navigateTo, route } = await vi.hoisted(async () => {
  const { reactive, ref } = await import("vue");
  return {
    isDesktop: ref(true),
    navigateTo: vi.fn(),
    route: reactive({ meta: { datasetDetail: false } }),
  };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
mockNuxtImport("useRoute", () => () => route);
mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);
mockNuxtImport("navigateTo", () => navigateTo);

vi.mock("@swissgeo/map", async () => {
  const { reactive } = await import("vue");
  return {
    OLMapScale: { name: "OLMapScale", template: "<div />" },
    useMapStore: () => reactive({ olMap: null }),
  };
});

const stubs = {
  ClientOnly: { template: "<div><slot /></div>" },
  FooterMapInfos: { name: "FooterMapInfos", template: "<div />" },
  FooterLinks: { name: "FooterLinks", template: "<div />" },
  UDrawer: { template: "<div><slot /></div>" },
  UButton: {
    name: "UButton",
    props: ["label", "variant"],
    template: "<button>{{ label }}</button>",
  },
};

function mountFooter() {
  return mount(Footer, { global: { stubs } });
}

function navButton(wrapper: ReturnType<typeof mountFooter>, label: string) {
  return wrapper
    .findAllComponents({ name: "UButton" })
    .find((button) => button.props("label") === `footer.mobileNav.${label}`)!;
}

describe("Footer.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isDesktop.value = true;
    route.meta.datasetDetail = false;
    navigateTo.mockClear();
  });

  it("shows the map infos and links on desktop, without mobile navigation", () => {
    const wrapper = mountFooter();

    expect(wrapper.findComponent({ name: "FooterMapInfos" }).exists()).toBe(
      true,
    );
    expect(wrapper.findComponent({ name: "FooterLinks" }).exists()).toBe(true);
    expect(navButton(wrapper, "catalog")).toBeUndefined();
  });

  describe("on mobile", () => {
    beforeEach(() => {
      isDesktop.value = false;
    });

    it("shows the navigation to map, catalog and tools", () => {
      const wrapper = mountFooter();

      expect(
        wrapper
          .findAllComponents({ name: "UButton" })
          .map((button) => button.props("label")),
      ).toEqual(
        expect.arrayContaining([
          "footer.mobileNav.map",
          "footer.mobileNav.catalog",
          "footer.mobileNav.tools",
        ]),
      );
      expect(wrapper.findComponent({ name: "FooterMapInfos" }).exists()).toBe(
        false,
      );
    });

    it("highlights the map while the layer cart is shown", () => {
      useSidebarStore().setSidebar(SidebarType.LAYER_CART);

      const wrapper = mountFooter();

      expect(navButton(wrapper, "map").props("variant")).toBe("solid-inverted");
      expect(navButton(wrapper, "catalog").props("variant")).toBe(
        "ghost-inverted",
      );
      expect(navButton(wrapper, "tools").props("variant")).toBe(
        "ghost-inverted",
      );
    });

    it("opens the catalog and highlights it instead of the map", async () => {
      const sidebarStore = useSidebarStore();
      sidebarStore.setSidebar(SidebarType.LAYER_CART);
      const wrapper = mountFooter();

      await navButton(wrapper, "catalog").trigger("click");

      expect(sidebarStore.currentSidebar).toBe(SidebarType.GEOCATALOG_TREE);
      expect(navButton(wrapper, "catalog").props("variant")).toBe(
        "solid-inverted",
      );
      expect(navButton(wrapper, "map").props("variant")).toBe("ghost-inverted");
    });

    it("goes to the map to show the catalog", async () => {
      await navButton(mountFooter(), "catalog").trigger("click");

      expect(navigateTo).toHaveBeenCalledWith("/de/map");
    });

    it("opens the layer cart on the map", async () => {
      const sidebarStore = useSidebarStore();

      await navButton(mountFooter(), "map").trigger("click");

      expect(sidebarStore.currentSidebar).toBe(SidebarType.LAYER_CART);
      expect(navigateTo).toHaveBeenCalledWith("/de/map");
    });

    it("closes the layer cart when it is already shown", async () => {
      const sidebarStore = useSidebarStore();
      sidebarStore.setSidebar(SidebarType.LAYER_CART);

      await navButton(mountFooter(), "map").trigger("click");

      expect(sidebarStore.isSidebarOpen).toBe(false);
      expect(navigateTo).not.toHaveBeenCalled();
    });

    it("brings the layer cart back from a dataset page instead of closing it", async () => {
      const sidebarStore = useSidebarStore();
      sidebarStore.setSidebar(SidebarType.LAYER_CART);
      route.meta.datasetDetail = true;

      await navButton(mountFooter(), "map").trigger("click");

      expect(sidebarStore.currentSidebar).toBe(SidebarType.LAYER_CART);
      expect(navigateTo).toHaveBeenCalledWith("/de/map");
    });

    it("switches from the catalog to the layer cart", async () => {
      const sidebarStore = useSidebarStore();
      sidebarStore.setSidebar(SidebarType.GEOCATALOG_TREE);

      await navButton(mountFooter(), "map").trigger("click");

      expect(sidebarStore.currentSidebar).toBe(SidebarType.LAYER_CART);
    });

    it("highlights neither map nor catalog when another sidebar is shown", () => {
      useSidebarStore().setSidebar(SidebarType.CONTENT);

      const wrapper = mountFooter();

      expect(navButton(wrapper, "map").props("variant")).toBe("ghost-inverted");
      expect(navButton(wrapper, "catalog").props("variant")).toBe(
        "ghost-inverted",
      );
    });
  });
});
