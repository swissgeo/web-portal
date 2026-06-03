import type { Layer } from "@swissgeo/layers";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useAttributionSources } from "../useAttributionSources";

const getMapLayerFromUuid = vi.hoisted(() => vi.fn());

mockNuxtImport("useMapViewStore", () => () => ({ getMapLayerFromUuid }));

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    type: "dataset",
    uuid: crypto.randomUUID(),
    humanId: "test-layer",
    isLoading: false,
    ...overrides,
  };
}

describe("useAttributionSources", () => {
  beforeEach(() => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: false });
  });

  it("returns empty array when no layers have attribution", () => {
    const layers = [makeLayer(), makeLayer()];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);
  });

  it("returns sources for visible layers with attribution", () => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    const layers = [
      makeLayer({
        info: {
          displayName: "A",
          attribution: { title: "Source A", url: "https://a.com" },
        },
      }),
      makeLayer({
        info: { displayName: "B", attribution: { title: "Source B" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([
      { id: "Source A", name: "Source A", url: "https://a.com" },
      { id: "Source B", name: "Source B", url: undefined },
    ]);
  });

  it("excludes invisible layers", () => {
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "Source A" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);
  });

  it("deduplicates sources with the same name", () => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "Shared Source" } },
      }),
      makeLayer({
        info: { displayName: "B", attribution: { title: "Shared Source" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toHaveLength(1);
    expect(sources.value[0]!.name).toBe("Shared Source");
  });

  it("includes background layer attribution regardless of map visibility", () => {
    const background = makeLayer({
      info: { displayName: "BG", attribution: { title: "BG Source" } },
    });
    const { sources } = useAttributionSources([], background);
    expect(sources.value[0]!.name).toBe("BG Source");
  });

  it("includes background layer first, then visible overlay layers", () => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    const background = makeLayer({
      info: { displayName: "BG", attribution: { title: "BG Source" } },
    });
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "Layer Source" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, background);
    expect(sources.value[0]!.name).toBe("BG Source");
    expect(sources.value[1]!.name).toBe("Layer Source");
  });

  it("replaces dots and underscores with hyphens in id", () => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "swisstopo.ch_data" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value[0]!.id).toBe("swisstopo-ch-data");
  });

  it("reacts to ref changes", () => {
    const layers = ref<Layer[]>([]);
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);

    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    layers.value = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "Dynamic Source" } },
      }),
    ];
    expect(sources.value[0]!.name).toBe("Dynamic Source");
  });
});
