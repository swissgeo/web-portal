import type { Layer } from "@swissgeo/layers";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useBackgroundLayers } from "~/composables/useBackgroundLayers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

const { fetchMock, locale } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    fetchMock: vi.fn(),
    locale: ref("de"),
  };
});

mockNuxtImport("useCatalogItemsUrl", () => {
  return () => (backgroundId: string) =>
    `https://catalog.test/items/${backgroundId}`;
});

mockNuxtImport("useI18n", () => {
  return () => ({ locale });
});

vi.mock("@swissgeo/layers", () => ({
  makeServerLayer: (dataset: { id: string }) => ({
    data: dataset,
    humanId: dataset.id,
    uuid: dataset.id,
  }),
}));

describe("useBackgroundLayers", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => ({
      id: new URL(url).pathname.split("/").at(-1),
    }));
    vi.stubGlobal("$fetch", fetchMock);
  });

  it("loads the background choices and selects the color map by default", async () => {
    const currentBackground = ref<Layer | null | undefined>(undefined);
    const selectBackground = vi.fn();

    const { backgroundLayers } = useBackgroundLayers(
      currentBackground,
      ref(true),
      selectBackground,
    );

    await vi.waitFor(() => {
      expect(backgroundLayers.value).toHaveLength(4);
    });
    await nextTick();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(selectBackground).toHaveBeenCalledWith(
      expect.objectContaining({
        humanId: "ch.swisstopo.pixelkarte-farbe",
      }),
    );
  });

  it("does not load background choices outside the map", async () => {
    const { backgroundLayers } = useBackgroundLayers(
      ref<Layer | null | undefined>(undefined),
      ref(false),
      vi.fn(),
    );

    await nextTick();

    expect(backgroundLayers.value).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
