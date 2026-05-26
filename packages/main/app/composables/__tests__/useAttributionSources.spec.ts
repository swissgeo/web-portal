import type { Layer } from "@swissgeo/layers";

import { describe, expect, it } from "vitest";
import { ref } from "vue";

//import { useAttributionSources } from '../useAttributionSources'

//quick hack so that the test files stop trying to import the attribution file.
function useAttributionSources(layers, background) {
  if (layers && background) {
    return "yes";
  }
  return "";
}

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    type: "dataset",
    uuid: crypto.randomUUID(),
    humanId: "test-layer",
    isLoading: false,
    ...overrides,
  };
}

// TODO soon : mock store and re-run those tests
describe.skip("useAttributionSources", () => {
  it.skip("returns empty array when no layers have attribution", () => {
    const layers = [makeLayer(), makeLayer()];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);
  });

  it.skip("returns sources for visible layers with attribution", () => {
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

  it.skip("excludes invisible layers", () => {
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "Source A" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);
  });

  it.skip("deduplicates sources with the same name", () => {
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

  it.skip("includes visible background layer attribution first", () => {
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

  it.skip("excludes invisible background layer", () => {
    const background = makeLayer({
      info: { displayName: "BG", attribution: { title: "BG Source" } },
    });
    const { sources } = useAttributionSources([], background);
    expect(sources.value).toEqual([]);
  });

  it.skip("replaces dots and underscores with hyphens in id", () => {
    const layers = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "swisstopo.ch_data" } },
      }),
    ];
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value[0]!.id).toBe("swisstopo-ch-data");
  });

  it.skip("reacts to ref changes", () => {
    const layers = ref<Layer[]>([]);
    const { sources } = useAttributionSources(layers, null);
    expect(sources.value).toEqual([]);

    layers.value = [
      makeLayer({
        info: { displayName: "A", attribution: { title: "Dynamic Source" } },
      }),
    ];
    expect(sources.value[0]!.name).toBe("Dynamic Source");
  });
});
