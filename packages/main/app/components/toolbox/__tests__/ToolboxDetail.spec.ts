import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { useToolboxStore } from "~/stores/toolbox";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ToolboxDetail from "@/components/toolbox/ToolboxDetail.vue";

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));

describe("ToolboxDetail.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isDesktop.value = true;
  });

  function mountDetail() {
    return mount(ToolboxDetail, {
      shallow: true,
    });
  }

  it("renders nothing when no panel is active", () => {
    const wrapper = mountDetail();
    expect(wrapper.find("div").exists()).toBe(false);
  });

  it("renders the outer container when a panel is active", () => {
    const toolboxStore = useToolboxStore();
    toolboxStore.toggleDetailPanel("share");

    const wrapper = mountDetail();
    expect(wrapper.find("div").exists()).toBe(true);
  });

  it("hides all panels when panel is closed", async () => {
    const toolboxStore = useToolboxStore();
    toolboxStore.toggleDetailPanel("share");
    toolboxStore.toggleDetailPanel("share");

    const wrapper = mountDetail();
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: "ToolboxShare" }).exists()).toBe(
      false,
    );
  });

  describe("on a mobile viewport", () => {
    beforeEach(() => {
      isDesktop.value = false;
    });

    it("shows the tool in the drawer above the footer", () => {
      useToolboxStore().activeDetailPanel = "share";

      const panel = mountDetail().findComponent({ name: "ResponsivePanel" });

      expect(panel.exists()).toBe(true);
      expect(panel.props("title")).toBe("toolbox.share.title");
      expect(panel.props("hasHeader")).toBe(false);
    });

    it("closes the tool when the drawer closes", async () => {
      const toolboxStore = useToolboxStore();
      toolboxStore.activeDetailPanel = "import";

      await mountDetail()
        .findComponent({ name: "ResponsivePanel" })
        .vm.$emit("close");

      expect(toolboxStore.activeDetailPanel).toBeNull();
    });

    it("lets the drawing panel scroll itself", () => {
      useToolboxStore().activeDetailPanel = "drawing";

      const panel = mountDetail().findComponent({ name: "ResponsivePanel" });

      expect(panel.props("hasOwnScroller")).toBe(true);
    });
  });
});
