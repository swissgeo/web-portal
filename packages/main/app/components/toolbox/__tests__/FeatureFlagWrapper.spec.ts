import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FeatureFlagWrapper from "@/components/toolbox/toolboxButtons/FeatureFlagWrapper.vue";

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
mockNuxtImport("useCmsUrl", () => () => ({
  cmsUrl: (path?: string) => `https://cms.test/en/${path ?? ""}`,
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Opens like the real popover: on click in click mode, on hover otherwise.
const UPopover = {
  name: "UPopover",
  props: ["open", "mode", "content", "portal"],
  emits: ["update:open"],
  template: `
    <div
      @click="mode === 'click' && $emit('update:open', !open)"
      @mouseenter="mode === 'hover' && $emit('update:open', true)"
    >
      <slot />
      <div v-if="open" data-testid="popover-content"><slot name="content" /></div>
    </div>`,
};

const stubs = {
  UPopover,
  UButton: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

function mountWrapper() {
  return mount(FeatureFlagWrapper, {
    props: { featureFlagEnabled: false },
    slots: {
      default: `<template #default="{ isDisabled }">
        <button :disabled="isDisabled" data-testid="tool">Draw</button>
      </template>`,
    },
    global: { stubs },
  });
}

describe("FeatureFlagWrapper.vue", () => {
  beforeEach(() => {
    isDesktop.value = true;
  });

  it("renders the tool as is when the feature is enabled", () => {
    const wrapper = mount(FeatureFlagWrapper, {
      props: { featureFlagEnabled: true },
      slots: { default: '<button data-testid="tool">Draw</button>' },
      global: { stubs },
    });

    expect(wrapper.findComponent({ name: "UPopover" }).exists()).toBe(false);
    expect(wrapper.find("[data-testid='tool']").exists()).toBe(true);
  });

  it("opens the message on hover on desktop", () => {
    const popover = mountWrapper().findComponent({ name: "UPopover" });

    expect(popover.props("mode")).toBe("hover");
    expect(popover.props("content")).toMatchObject({ side: "left" });
  });

  describe("on a mobile viewport", () => {
    beforeEach(() => {
      isDesktop.value = false;
    });

    it("shows the coming soon message and the roadmap link on a tap", async () => {
      const wrapper = mountWrapper();
      expect(wrapper.find("[data-testid='popover-content']").exists()).toBe(
        false,
      );

      await wrapper
        .find("[data-testid='feature-flag-trigger']")
        .trigger("click");

      const content = wrapper.find("[data-testid='popover-content']");
      expect(content.text()).toContain("toolbox.featureFlag.notAvailable");
      expect(content.find("a").attributes("href")).toBe(
        "https://cms.test/en/toolbox.featureFlag.links.roadmap",
      );
    });

    it("lets the tap through the disabled button to the trigger", () => {
      const wrapper = mountWrapper();

      expect(
        wrapper.find("[data-testid='feature-flag-trigger']").classes(),
      ).toContain("*:pointer-events-none");
      expect(
        wrapper.find("[data-testid='tool']").attributes("disabled"),
      ).toBeDefined();
    });

    it("opens the message above the tool, inside the drawer", () => {
      const popover = mountWrapper().findComponent({ name: "UPopover" });

      expect(popover.props("content")).toMatchObject({ side: "top" });
      // Outside of the drawer, it takes the focus and the drawer closes
      expect(popover.props("portal")).toBe(false);
    });

    it("keeps the message open after the tap focused the tool", async () => {
      const wrapper = mountWrapper();
      const trigger = wrapper.find("[data-testid='feature-flag-trigger']");

      await trigger.trigger("focus");
      await trigger.trigger("click");

      expect(wrapper.find("[data-testid='popover-content']").exists()).toBe(
        true,
      );
    });
  });
});
