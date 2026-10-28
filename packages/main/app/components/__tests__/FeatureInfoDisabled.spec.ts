import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import FeatureInfoDisabled from "../featuresinfo/FeatureInfoDisabled.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) =>
      key === "toolbox.featureFlag.links.roadmap"
        ? "mapviewer-perspective"
        : key,
    locale: { value: "en" },
  }),
}));

mockNuxtImport("useCmsUrl", () => () => ({
  cmsUrl: (path?: string) => `https://cms.test/en/${path ?? ""}`,
}));

describe("FeatureInfoDisabled", () => {
  function mountPopover() {
    return mount(FeatureInfoDisabled, {
      global: {
        stubs: {
          UButton: {
            template: '<button :href="to"><slot /></button>',
            props: ["to", "icon", "variant", "size", "target", "ui"],
          },
        },
      },
    });
  }

  it("shows the feature flag message", () => {
    const wrapper = mountPopover();
    expect(wrapper.text()).toContain("featureInfo.featureFlag.notAvailable");
    expect(wrapper.text()).toContain("featureInfo.featureFlag.workingOnIt");
  });

  it("links to the roadmap", () => {
    const wrapper = mountPopover();
    const roadmapLink = wrapper
      .findAll("button")
      .find((b) => b.text().includes("featureInfo.featureFlag.workingOnIt"));
    expect(roadmapLink?.attributes("href")).toBe(
      "https://cms.test/en/mapviewer-perspective",
    );
  });

  it("spawns at the given initial position", () => {
    const wrapper = mount(FeatureInfoDisabled, {
      props: { initialPosition: { x: 345, y: 120 } },
      global: {
        stubs: {
          UButton: {
            template: '<button :href="to"><slot /></button>',
            props: ["to", "icon", "variant", "size", "target", "ui"],
          },
        },
      },
    });
    const style = wrapper.attributes("style");
    expect(style).toContain("left: 345px");
    expect(style).toContain("top: 120px");
  });
});
