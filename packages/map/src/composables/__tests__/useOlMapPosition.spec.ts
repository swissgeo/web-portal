import type { CoordinateSystem } from "@swissgeo/coordinates";
import type { Ref } from "vue";

import { flushPromises } from "@vue/test-utils";
import { View } from "ol";
import { defaults } from "ol/interaction";
import Map from "ol/Map";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive, ref } from "vue";

import { useOlMapPosition } from "../useOlMapPosition";

const olMapRef = ref<Map | undefined>(undefined);

const createMap = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const map = new Map({
    target: container,
    interactions: defaults(),
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  map.setSize([800, 600]);

  return map;
};

const { useMapStore } = vi.hoisted(() => ({
  useMapStore: vi.fn(),
}));

vi.mock("@/stores/map", () => ({
  useMapStore,
}));

useMapStore.mockReturnValue(
  reactive({
    olMap: olMapRef,
  }) as unknown as { olMap: Map },
);

describe("useOlMapPosition", () => {
  beforeEach(() => {
    olMapRef.value = createMap();
  });

  // mocking a projection to be given to useOlMapPosition
  // @ts-expect-error TS2322  Projection would need more props
  const projection: Ref<Pick<CoordinateSystem, "bounds" | "getDefaultZoom">> =
    ref({
      bounds: {
        center: [13, 37],
      },
      getDefaultZoom: () => 3,
    });

  it("Returns defaults when openlayers isn't available", () => {
    useMapStore.mockReturnValueOnce({
      olMap: null,
    });

    const { zoom, center, rotation } = useOlMapPosition(ref(false), projection);

    expect(center.value).toEqual([13, 37]);
    expect(zoom.value).toEqual(3);
    expect(rotation.value).toEqual(0);
  });

  it("Returns the ol values after map becomes available", async () => {
    const olMapRef = ref<Map | null>(null);

    useMapStore.mockReturnValueOnce(
      reactive({
        olMap: olMapRef,
      }),
    );

    // cross checking again
    const { zoom, center, rotation } = useOlMapPosition(ref(false), projection);
    expect(center.value).toEqual([13, 37]);
    expect(zoom.value).toEqual(3);
    expect(rotation.value).toEqual(0);

    olMapRef.value = createMap();
    await flushPromises();

    expect(center.value).toEqual([0, 0]);
    expect(zoom.value).toEqual(1);
    expect(rotation.value).toEqual(0);
  });

  it("updates zoom when openlayers updates it", () => {
    const { zoom } = useOlMapPosition(ref(false), projection);

    expect(zoom.value).toEqual(1);
    olMapRef.value.getView().setZoom(13);
    olMapRef.value.dispatchEvent("moveend");
    expect(zoom.value).toEqual(13);
  });

  it("updates center when openlayers updates it", () => {
    const { center } = useOlMapPosition(ref(false), projection);

    expect(center.value).toEqual([0, 0]);
    olMapRef.value.getView().setCenter([46.927652279098595, 7.451517157238107]);
    olMapRef.value.dispatchEvent("moveend");
    expect(center.value).toEqual([46.927652279098595, 7.451517157238107]);
  });

  it("updates rotation when openlayers updates it", () => {
    const { rotation } = useOlMapPosition(ref(false), projection);

    expect(rotation.value).toEqual(0);
    olMapRef.value.getView().setRotation(Math.PI);
    olMapRef.value.dispatchEvent("moveend");
    expect(rotation.value).toEqual(Math.PI);
  });

  it("Still works when the view changes", async () => {
    // cross checking the ol defaults
    const { zoom, center, rotation } = useOlMapPosition(ref(false), projection);
    expect(center.value).toEqual([0, 0]);
    expect(zoom.value).toEqual(1);
    expect(rotation.value).toEqual(0);

    const newView = new View({
      center: [49.60080394469794, 6.1279069383788585],
      zoom: 12,
      rotation: 13,
    });

    olMapRef.value.setView(newView);
    await flushPromises();

    expect(center.value).toEqual([49.60080394469794, 6.1279069383788585]);
    expect(zoom.value).toEqual(12);
    expect(rotation.value).toEqual(13);
  });

  it("Returns the ol values after we register a new map", async () => {
    const olMapRef = ref<Map | null>(
      new Map({
        view: new View({
          center: [13, 37],
          zoom: 3,
        }),
      }),
    );

    useMapStore.mockReturnValueOnce(
      reactive({
        olMap: olMapRef,
      }),
    );

    // cross checking again
    const { zoom, center, rotation } = useOlMapPosition(ref(false), projection);
    expect(center.value).toEqual([13, 37]);
    expect(zoom.value).toEqual(3);
    expect(rotation.value).toEqual(0);

    olMapRef.value = createMap();
    await flushPromises();

    expect(center.value).toEqual([0, 0]);
    expect(zoom.value).toEqual(1);
    expect(rotation.value).toEqual(0);
  });
});
