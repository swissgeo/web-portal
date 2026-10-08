import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { mount } from "@vue/test-utils";
import Footer from "~/components/footer/Footer.vue";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isDesktop, navigateTo } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true), navigateTo: vi.fn() };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
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
