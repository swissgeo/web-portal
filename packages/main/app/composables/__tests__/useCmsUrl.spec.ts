import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCmsUrl } from "../useCmsUrl";

const { locale } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { locale: ref("de") };
});

mockNuxtImport("useI18n", () => () => ({ locale }));
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { cmsBaseUrl: "https://cms.example.test" },
}));

describe("useCmsUrl", () => {
  beforeEach(() => {
    locale.value = "de";
  });

  it("joins base url, locale and path", () => {
    const { cmsUrl } = useCmsUrl();
    expect(cmsUrl("pages/about")).toBe(
      "https://cms.example.test/de/pages/about",
    );
  });

  it("returns base url with locale when no path given", () => {
    const { cmsUrl } = useCmsUrl();
    expect(cmsUrl()).toBe("https://cms.example.test/de");
  });

  it("returns base url with locale when path is empty string", () => {
    const { cmsUrl } = useCmsUrl();
    expect(cmsUrl("")).toBe("https://cms.example.test/de");
  });

  it("drops leading slash of path", () => {
    const { cmsUrl } = useCmsUrl();
    expect(cmsUrl("/pages/about")).toBe(
      "https://cms.example.test/de/pages/about",
    );
  });

  it("uses current locale value", () => {
    const { cmsUrl } = useCmsUrl();
    locale.value = "fr";
    expect(cmsUrl("pages/about")).toBe(
      "https://cms.example.test/fr/pages/about",
    );
  });

  it("uses German locale for Romansh locale", () => {
    const { cmsUrl } = useCmsUrl();
    locale.value = "rm";
    expect(cmsUrl("pages/about")).toBe(
      "https://cms.example.test/de/pages/about",
    );
  });
});
