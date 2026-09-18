import type { Point } from "ol/geom";
import type { Vector as VectorLayer } from "ol/layer";
import type { Vector as VectorSource } from "ol/source";
import type { Style } from "ol/style";

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
  const pinnedMarkerType = vueRef<"crosshair" | "balloon">("crosshair");
  return {
    useSearchStore: () => ({
      get pinnedCoordinate() {
        return pinnedCoordinate.value;
      },
      get pinnedMarkerType() {
        return pinnedMarkerType.value;
      },
      setPinnedCoordinate: (
        coordinate: [number, number],
        type: "crosshair" | "balloon" = "crosshair",
      ) => {
        pinnedCoordinate.value = coordinate;
        pinnedMarkerType.value = type;
      },
      clearPinnedCoordinate: () => {
        pinnedCoordinate.value = undefined;
        pinnedMarkerType.value = "crosshair";
      },
    }),
  };
});

function markerFeature() {
  const source = layerUnderTest!.value.getSource() as VectorSource;
  const [feature] = source.getFeatures();
  return feature!;
}

function markerCoordinates(): number[] {
  return (markerFeature().getGeometry() as Point).getCoordinates();
}

// the crosshair is drawn by two styles, the balloon pin by a single icon
function markerImages(): string[] {
  const style = markerFeature().getStyle() as Style | Style[];
  return (Array.isArray(style) ? style : [style]).map(
    (one) => one.getImage()!.constructor.name,
  );
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

  it("draws the crosshair of a typed coordinate", () => {
    useSearchStore().setPinnedCoordinate([2600000, 1200000]);
    mountMarker();

    expect(markerImages()).toEqual(["CircleStyle", "RegularShape"]);
  });

  it("draws the balloon pin of a place", async () => {
    const searchStore = useSearchStore();
    searchStore.setPinnedCoordinate([2600000, 1200000]);
    mountMarker();

    searchStore.setPinnedCoordinate([2617000, 1091000], "balloon");
    await nextTick();

    expect(markerImages()).toEqual(["Icon"]);
  });
});
