import type { Point } from "ol/geom";
import type { Vector as VectorLayer } from "ol/layer";
import type { Vector as VectorSource } from "ol/source";

import { useSearchStore } from "@swissgeo/skeleton";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import OpenLayersSearchMarker from "../OpenLayersSearchMarker.vue";

const { addLayerToMap } = vi.hoisted(() => ({ addLayerToMap: vi.fn() }));

let layerUnderTest: { value: VectorLayer } | undefined;

vi.mock("@swissgeo/map", () => ({
  useAddLayerToMap: (layer: { value: VectorLayer }) => {
    layerUnderTest = layer;
    return { addLayerToMap };
  },
}));

// only the pinned coordinate matters here, and it has to stay reactive so that
// the component picks up a change
vi.mock("@swissgeo/skeleton", async () => {
  const { ref: vueRef } = await import("vue");
  const pinnedCoordinate = vueRef<[number, number] | undefined>();
  return {
    useSearchStore: () => ({
      get pinnedCoordinate() {
        return pinnedCoordinate.value;
      },
      setPinnedCoordinate: (coordinate: [number, number]) => {
        pinnedCoordinate.value = coordinate;
      },
      clearPinnedCoordinate: () => {
        pinnedCoordinate.value = undefined;
      },
    }),
  };
});

function markerCoordinates(): number[] {
  const source = layerUnderTest!.value.getSource() as VectorSource;
  const [feature] = source.getFeatures();
  return (feature!.getGeometry() as Point).getCoordinates();
}

function mountMarker() {
  return mount(OpenLayersSearchMarker, {
    global: { provide: { olMap: ref(undefined) } },
  });
}

describe("OpenLayersSearchMarker", () => {
  beforeEach(() => {
    addLayerToMap.mockReset();
    layerUnderTest = undefined;
    useSearchStore().clearPinnedCoordinate();
  });

  it("adds a layer holding the pinned coordinate to the map", () => {
    useSearchStore().setPinnedCoordinate([2600000, 1200000]);
    mountMarker();

    expect(addLayerToMap).toHaveBeenCalled();
    expect(markerCoordinates()).toEqual([2600000, 1200000]);
  });

  it("follows the pinned coordinate when it changes", async () => {
    const searchStore = useSearchStore();
    searchStore.setPinnedCoordinate([2600000, 1200000]);
    mountMarker();

    searchStore.setPinnedCoordinate([2700000, 1250000]);
    await nextTick();

    expect(markerCoordinates()).toEqual([2700000, 1250000]);
  });

  it("starts at the origin when nothing is pinned yet", () => {
    mountMarker();

    expect(markerCoordinates()).toEqual([0, 0]);
  });
});
