import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises, shallowMount } from "@vue/test-utils";
import LayersPanel from "~/components/debug/LayersPanel.vue";
import { describe, expect, it, vi } from "vitest";

const { useOgcCatalogSpy, locale } = vi.hoisted(() => ({
  useOgcCatalogSpy: vi.fn(() => ({
    data: [],
  })),
  locale: "de",
}));

vi.mock("~/composables/useOgcCatalog", () => ({
  useOgcCatalog: useOgcCatalogSpy,
}));

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
    locale,
  });
});

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({
    addLayer: vi.fn(),
  }),
  makeServerLayer: vi.fn(),
}));

vi.mock("@swissgeo/skeleton", () => ({
  IconButton: {
    template: "<button><slot /></button>",
  },
}));

describe("LayersPanel.vue locale-aware records loading", () => {
  it("loads records from shared dataset collection composable", async () => {
    shallowMount(LayersPanel);

    await flushPromises();

    expect(useOgcCatalogSpy).toHaveBeenCalled();
    expect(useOgcCatalogSpy).toHaveBeenCalledWith(locale);
  });
});
