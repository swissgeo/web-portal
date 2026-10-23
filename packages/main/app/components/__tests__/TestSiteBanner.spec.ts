import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import TestSiteBanner from "@/components/TestSiteBanner.vue";

const { runtimeConfigMock } = vi.hoisted(() => ({
  runtimeConfigMock: { public: { testSiteBanner: "" } },
}));

mockNuxtImport("useRuntimeConfig", () => () => runtimeConfigMock);
mockNuxtImport("useI18n", () => () => ({
  t: (key: string, params: { environment: string }) =>
    `${key}:${params.environment}`,
}));

const UBannerStub = {
  name: "UBanner",
  props: ["color", "title", "ui"],
  template: '<div data-testid="test-site-banner">{{ title }}</div>',
};

function mountBanner(testSiteBanner: string) {
  runtimeConfigMock.public = { testSiteBanner };
  return mount(TestSiteBanner, {
    global: { stubs: { UBanner: UBannerStub } },
  });
}

describe("TestSiteBanner.vue", () => {
  it.each([
    { testSite: "dev", color: "error", root: "", environment: "DEV" },
    { testSite: "int", color: "warning", root: "", environment: "INT" },
    {
      testSite: "preview",
      color: "neutral",
      root: "bg-purple-800",
      environment: "PREVIEW",
    },
  ])(
    "shows the $environment banner in $color",
    ({ testSite, color, root, environment }) => {
      const banner = mountBanner(testSite).getComponent({ name: "UBanner" });

      expect(banner.props("color")).toBe(color);
      expect(banner.props("ui").root).toBe(root);
      expect(banner.text()).toBe(`testSiteBanner.text:${environment}`);
    },
  );

  it.each([
    { staging: "prod (empty)", value: "" },
    { staging: "unknown value", value: "prod" },
    { staging: "object key", value: "toString" },
  ])("shows no banner for $staging", ({ value }) => {
    const wrapper = mountBanner(value);

    expect(wrapper.find('[data-testid="test-site-banner"]').exists()).toBe(
      false,
    );
  });
});
