import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Toolbox from "@/components/toolbox/Toolbox.vue";

const { isDesktop, enabledFlags, toolboxStore } = await vi.hoisted(async () => {
  const { reactive, ref } = await import("vue");
  return {
    isDesktop: ref(true),
    enabledFlags: ref<string[]>([]),
    toolboxStore: reactive({
      showFullScreenButton: true,
      showGeolocationButton: true,
      show3dButton: false,
      showCompassButton: false,
      showDrawButton: true,
      showMeasureButton: true,
      showCompareSliderButton: true,
      showImportButton: true,
      showShareButton: true,
      showPrintButton: true,
      showZoomButtons: true,
      activeDetailPanel: null as string | null,
    }),
  };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));
mockNuxtImport("useFeatureFlags", () => () => ({
  isEnabled: (flag: string) => enabledFlags.value.includes(flag),
}));
mockNuxtImport("useCmsUrl", () => () => ({
  cmsUrl: (path: string) => `https://cms.test/de/${path}`,
}));
vi.mock("@/stores/toolbox", () => ({ useToolboxStore: () => toolboxStore }));

function stub(name: string, props: string[] = []) {
  return { name, props, template: `<div data-stub="${name}" />` };
}

const stubs = {
  UCard: { template: "<div><slot /></div>" },
  ResponsivePanel: {
    name: "ResponsivePanel",
    props: { title: String, fitsContent: Boolean },
    template: '<div data-stub="ResponsivePanel"><slot /></div>',
  },
  FullScreenButton: stub("FullScreenButton", ["iconOnly"]),
  GeolocButton: stub("GeolocButton", ["iconOnly"]),
  Toggle3dButton: stub("Toggle3dButton"),
  CompassButton: stub("CompassButton"),
  DrawButton: stub("DrawButton"),
  MeasureButton: stub("MeasureButton"),
  CompareSliderButton: stub("CompareSliderButton"),
  ImportButton: stub("ImportButton"),
  ShareButton: stub("ShareButton"),
  PrintButton: stub("PrintButton"),
  ZoomButtons: stub("ZoomButtons"),
  ToolboxDetail: stub("ToolboxDetail"),
};

function mountToolbox() {
  return mount(Toolbox, { global: { stubs } });
}

describe("Toolbox.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isDesktop.value = true;
    enabledFlags.value = [];
    toolboxStore.activeDetailPanel = null;
  });

  it("shows the map controls, tools and zoom on the map on desktop", () => {
    const wrapper = mountToolbox();
    const right = wrapper.find("[data-testid='toolbox-right']");

    for (const name of ["FullScreenButton", "DrawButton", "ZoomButtons"]) {
      expect(right.find(`[data-stub='${name}']`).exists()).toBe(true);
    }
    expect(
      wrapper.findComponent({ name: "FullScreenButton" }).props("iconOnly"),
    ).toBe(false);
    expect(wrapper.findComponent({ name: "ResponsivePanel" }).exists()).toBe(
      false,
    );
  });

  it("keeps the desktop toolbox on a narrow viewport while the mobile UI is off", () => {
    isDesktop.value = false;
    const wrapper = mountToolbox();

    expect(
      wrapper
        .find("[data-testid='toolbox-right'] [data-stub='DrawButton']")
        .exists(),
    ).toBe(true);
    expect(wrapper.findComponent({ name: "ResponsivePanel" }).exists()).toBe(
      false,
    );
  });

  describe("on a mobile viewport", () => {
    beforeEach(() => {
      isDesktop.value = false;
      enabledFlags.value = ["enableMobileUi"];
    });

    it("keeps only fullscreen and geolocation on the map, as icons", () => {
      const wrapper = mountToolbox();
      const right = wrapper.find("[data-testid='toolbox-right']");

      expect(
        right.findAll("[data-stub]").map((el) => el.attributes("data-stub")),
      ).toEqual(["FullScreenButton", "GeolocButton"]);
      expect(
        wrapper.findComponent({ name: "FullScreenButton" }).props("iconOnly"),
      ).toBe(true);
      expect(
        wrapper.findComponent({ name: "GeolocButton" }).props("iconOnly"),
      ).toBe(true);
    });

    it("sits below the drawers in the top right corner", () => {
      const right = mountToolbox().find("[data-testid='toolbox-right']");

      expect(right.classes()).toEqual(
        expect.arrayContaining(["top-4", "right-4", "z-10"]),
      );
      expect(right.classes()).not.toContain("bottom-4");
    });

    it("shows the zoom buttons above the footer and the attribution", () => {
      const zoom = mountToolbox().find("[data-testid='toolbox-zoom']");

      expect(zoom.find("[data-stub='ZoomButtons']").exists()).toBe(true);
      expect(zoom.classes()).toEqual(
        expect.arrayContaining(["right-4", "bottom-24", "z-10"]),
      );
    });

    it("shows the tools only in the tools drawer, without import and print", async () => {
      const wrapper = mountToolbox();
      expect(wrapper.find("[data-stub='DrawButton']").exists()).toBe(false);

      useSidebarStore().setSidebar(SidebarType.TOOLS);
      await nextTick();

      const tools = wrapper.find("[data-testid='toolbox-mobile-tools']");
      for (const name of [
        "DrawButton",
        "MeasureButton",
        "CompareSliderButton",
        "ShareButton",
      ]) {
        expect(tools.find(`[data-stub='${name}']`).exists()).toBe(true);
      }
      for (const name of ["ImportButton", "PrintButton"]) {
        expect(wrapper.find(`[data-stub='${name}']`).exists()).toBe(false);
      }
    });

    it("opens the tools drawer only as high as its content", () => {
      useSidebarStore().setSidebar(SidebarType.TOOLS);

      expect(
        mountToolbox()
          .findComponent({ name: "ResponsivePanel" })
          .props("fitsContent"),
      ).toBe(true);
    });

    it("says once in the tools drawer that some tools follow later", () => {
      useSidebarStore().setSidebar(SidebarType.TOOLS);

      const remark = mountToolbox().find(
        "[data-testid='toolbox-mobile-unavailable']",
      );

      expect(remark.text()).toContain("toolbox.featureFlag.someNotAvailable");
      expect(remark.find("a").attributes("href")).toBe(
        "https://cms.test/de/toolbox.featureFlag.links.roadmap",
      );
    });

    it("leaves the remark out when all tools are available", () => {
      enabledFlags.value = [
        "enableMobileUi",
        "tools.enableDrawing",
        "tools.enableMeasure",
        "tools.enableCompare",
        "tools.enableShare",
      ];
      useSidebarStore().setSidebar(SidebarType.TOOLS);

      expect(
        mountToolbox()
          .find("[data-testid='toolbox-mobile-unavailable']")
          .exists(),
      ).toBe(false);
    });

    it("closes the tools drawer when a tool opens its panel", async () => {
      const sidebarStore = useSidebarStore();
      sidebarStore.setSidebar(SidebarType.TOOLS);
      mountToolbox();

      toolboxStore.activeDetailPanel = "share";
      await nextTick();

      expect(sidebarStore.isSidebarOpen).toBe(false);
    });
  });
});
