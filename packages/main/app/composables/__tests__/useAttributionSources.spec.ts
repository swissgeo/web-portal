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

function makeAttribution(abbreviation: string) {
  return { abbreviation, name: `${abbreviation} full name` };
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
          attribution: {
            abbreviation: "Source A",
            name: "Source A full name",
            url: "https://a.com",
          },
        },
      }),
      makeLayer({
        info: { displayName: "B", attribution: makeAttribution("Source B") },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([
      {
        abbreviation: "Source A",
        name: "Source A full name",
        url: "https://a.com",
      },
      {
        abbreviation: "Source B",
        name: "Source B full name",
        url: undefined,
      },
    ]);
  });

  it("excludes invisible layers", () => {
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: makeAttribution("Source A") },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);
  });

  it("deduplicates sources with the same abbreviation", () => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    const layers = [
      makeLayer({
        info: {
          displayName: "A",
          attribution: makeAttribution("Shared Source"),
        },
      }),
      makeLayer({
        info: {
          displayName: "B",
          attribution: makeAttribution("Shared Source"),
        },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toHaveLength(1);
    expect(sources.value[0]!.abbreviation).toBe("Shared Source");
  });

  it("includes background layer attribution regardless of map visibility", () => {
    const background = makeLayer({
      info: { displayName: "BG", attribution: makeAttribution("BG Source") },
    });
    const { sources } = useAttributionSources([], background);
    expect(sources.value[0]!.abbreviation).toBe("BG Source");
  });

  it("includes background layer first, then visible overlay layers", () => {
    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    const background = makeLayer({
      info: { displayName: "BG", attribution: makeAttribution("BG Source") },
    });
    const layers = [
      makeLayer({
        info: {
          displayName: "A",
          attribution: makeAttribution("Layer Source"),
        },
      }),
    ];
    const { sources } = useAttributionSources(layers, background);
    expect(sources.value[0]!.abbreviation).toBe("BG Source");
    expect(sources.value[1]!.abbreviation).toBe("Layer Source");
  });

  it("reacts to ref changes", () => {
    const layers = ref<Layer[]>([]);
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);

    getMapLayerFromUuid.mockReturnValue({ isVisible: true });
    layers.value = [
      makeLayer({
        info: {
          displayName: "A",
          attribution: makeAttribution("Dynamic Source"),
        },
      }),
    ];
    expect(sources.value[0]!.abbreviation).toBe("Dynamic Source");
  });
});
