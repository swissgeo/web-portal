import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Toolbox from "@/components/toolbox/Toolbox.vue";

const { isDesktop, toolboxStore } = await vi.hoisted(async () => {
  const { reactive, ref } = await import("vue");
  return {
    isDesktop: ref(true),
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
vi.mock("@/stores/toolbox", () => ({ useToolboxStore: () => toolboxStore }));

function stub(name: string, props: string[] = []) {
  return { name, props, template: `<div data-stub="${name}" />` };
}

const stubs = {
  UCard: { template: "<div><slot /></div>" },
  ResponsivePanel: {
    name: "ResponsivePanel",
    props: ["title"],
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

  describe("on a mobile viewport", () => {
    beforeEach(() => {
      isDesktop.value = false;
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

    it("shows the tools only in the tools drawer", async () => {
      const wrapper = mountToolbox();
      expect(wrapper.find("[data-stub='DrawButton']").exists()).toBe(false);

      useSidebarStore().setSidebar(SidebarType.TOOLS);
      await nextTick();

      const tools = wrapper.find("[data-testid='toolbox-mobile-tools']");
      for (const name of [
        "DrawButton",
        "MeasureButton",
        "CompareSliderButton",
        "ImportButton",
        "ShareButton",
        "PrintButton",
      ]) {
        expect(tools.find(`[data-stub='${name}']`).exists()).toBe(true);
      }
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
