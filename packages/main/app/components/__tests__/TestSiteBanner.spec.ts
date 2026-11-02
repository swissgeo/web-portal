import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import TestSiteBanner from "@/components/TestSiteBanner.vue";

const { environmentMock } = vi.hoisted(() => ({
  environmentMock: { environment: "prod" },
}));

mockNuxtImport("useEnvironment", () => () => environmentMock);
mockNuxtImport("useI18n", () => () => ({
  t: (key: string, params: { environment: string }) =>
    `${key}:${params.environment}`,
}));

const UBannerStub = {
  name: "UBanner",
  props: ["color", "title", "ui"],
  template: '<div data-testid="test-site-banner">{{ title }}</div>',
};

function mountBanner(environment: string) {
  environmentMock.environment = environment;
  return mount(TestSiteBanner, {
    global: { stubs: { UBanner: UBannerStub } },
  });
}

describe("TestSiteBanner.vue", () => {
  it.each([
    { environment: "dev", color: "error", root: "", label: "DEV" },
    { environment: "int", color: "warning", root: "", label: "INT" },
    {
      environment: "preview",
      color: "neutral",
      root: "bg-purple-800",
      label: "PREVIEW",
    },
  ])(
    "shows the $label banner in $color",
    ({ environment, color, root, label }) => {
      const banner = mountBanner(environment).getComponent({ name: "UBanner" });

      expect(banner.props("color")).toBe(color);
      expect(banner.props("ui").root).toBe(root);
      expect(banner.text()).toBe(`testSiteBanner.text:${label}`);
    },
  );

  it("shows the DEV banner for local dev", () => {
    const banner = mountBanner("local").getComponent({ name: "UBanner" });

    expect(banner.props("color")).toBe("error");
    expect(banner.text()).toBe("testSiteBanner.text:DEV");
  });

  it.each([{ staging: "prod", value: "prod" }])(
    "shows no banner for $staging",
    ({ value }) => {
      const wrapper = mountBanner(value);

      expect(wrapper.find('[data-testid="test-site-banner"]').exists()).toBe(
        false,
      );
    },
  );
});
