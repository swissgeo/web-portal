import { mount } from "@vue/test-utils";
import { useToolboxStore } from "~/stores/toolbox";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import ToolboxDetail from "@/components/toolbox/ToolboxDetail.vue";

describe("ToolboxDetail.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
});
