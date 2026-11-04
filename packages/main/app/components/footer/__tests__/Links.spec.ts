import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Links from "~/components/footer/Links.vue";
import { describe, expect, it } from "vitest";
import { reactive } from "vue";

const publicConfig = reactive({ version: "", cmsBaseUrl: "https://cms.test" });

mockNuxtImport("useRuntimeConfig", () => () => ({ public: publicConfig }));
mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));
mockNuxtImport("useCmsUrl", () => () => ({ cmsUrl: (path: string) => path }));

const stubs = {
  ReportIssueLink: true,
  UIcon: true,
  ULink: {
    inheritAttrs: false,
    props: ["to"],
    template: "<a :href='to' v-bind='$attrs'><slot /></a>",
  },
};

describe("Links.vue", () => {
  it.each`
    version                        | href
    ${"v0.8.0"}                    | ${"https://github.com/swissgeo/web-portal/releases/tag/v0.8.0"}
    ${"v0.9.0-beta.2"}             | ${"https://github.com/swissgeo/web-portal/releases/tag/v0.9.0-beta.2"}
    ${"v0.9.0-beta.2-2-g4e9f735f"} | ${"https://github.com/swissgeo/web-portal"}
    ${"ef8f2d99"}                  | ${"https://github.com/swissgeo/web-portal"}
    ${"unknown"}                   | ${"https://github.com/swissgeo/web-portal"}
  `("links version $version to $href", ({ version, href }) => {
    publicConfig.version = version;

    const link = mount(Links, { global: { stubs } }).get(
      "[data-testid='footer-version-link']",
    );

    expect(link.attributes("href")).toBe(href);
    expect(link.text()).toBe(version);
  });
});
