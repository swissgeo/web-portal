import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

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

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);

mockNuxtImport("useCmsUrl", () => () => ({
  cmsUrl: (path?: string) => `https://cms.test/en/${path ?? ""}`,
}));

describe("FeatureInfoDisabled", () => {
  function mountPopover() {
    return mount(FeatureInfoDisabled, {
      props: { initialPosition: { x: 10, y: 20 } },
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

  it("emits close when the close button is clicked", async () => {
    const wrapper = mountPopover();
    await wrapper
      .find("[data-testid='feature-info-disabled-close']")
      .trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  describe("on a mobile viewport", () => {
    const { innerWidth, innerHeight } = window;

    function mountAt(x: number, y: number) {
      window.innerWidth = 375;
      window.innerHeight = 812;
      isDesktop.value = false;
      return mount(FeatureInfoDisabled, {
        props: { initialPosition: { x, y } },
        global: { stubs: { UButton: true } },
      });
    }

    afterEach(() => {
      window.innerWidth = innerWidth;
      window.innerHeight = innerHeight;
      isDesktop.value = true;
    });

    it("fits the phone screen", () => {
      const notice = mountAt(0, 0);

      expect(notice.classes()).toContain("max-w-[calc(100vw-2rem)]");
      expect(notice.attributes("style")).toContain("left: 16px");
    });

    it("stays above the footer navigation after a tap at the bottom", () => {
      const style = mountAt(100, 800).attributes("style");

      // 812 - 16 margin - 64 footer
      expect(style).toContain("top: 732px");
    });

    it("follows the color mode", () => {
      expect(mountAt(0, 0).classes()).not.toContain("light");
    });
  });
});
