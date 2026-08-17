import type { Map as OlMap } from "ol";

import { mount } from "@vue/test-utils";
import { Feature } from "ol";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";

import type { MapClickEvent } from "@/types";

import { useMapClickEvent } from "../useMapClickEvent.composable";
import { createFakeOlMap } from "./__mocks__/composables";

const IDENTIFY_TOLERANCE_PX = 10;

const CLICK_COORDINATE: [number, number] = [2600000, 1200000];
const CLICK_PIXEL: [number, number] = [100, 200];

function makePointFeature(x: number, y: number): Feature {
  return new Feature({ geometry: new Point([x, y]) });
}

function makeVectorLayer(
  overrides: {
    uuid?: string;
    features?: Feature[];
    withSource?: boolean;
  } = {},
): VectorLayer {
  const { uuid, features = [], withSource = true } = overrides;
  const layer = new VectorLayer({
    source: withSource ? new VectorSource({ features }) : undefined,
  });
  if (uuid !== undefined) {
    layer.set("uuid", uuid);
  }
  return layer;
}

function setup(
  options: {
    resolution?: number | undefined;
    size?: [number, number] | undefined;
    layers?: unknown[];
  } = {},
) {
  // explicit undefined must survive (early-return paths), so default via
  // key presence rather than destructuring defaults
  const resolution = "resolution" in options ? options.resolution : 1;
  const size = "size" in options ? options.size : [800, 600];
  const layers = options.layers ?? [];
  const onClick = vi.fn();

  const { fakeMap, layers: mapLayers } = createFakeOlMap({
    view: { getResolution: vi.fn(() => resolution) },
    map: { getSize: vi.fn(() => size) },
  });
  mapLayers.push(...layers);

  const mapRef = ref<OlMap | undefined>(fakeMap as unknown as OlMap);

  const TestComponent = defineComponent({
    setup() {
      useMapClickEvent(onClick);
      return {};
    },
    template: "<div />",
  });

  const wrapper = mount(TestComponent, {
    global: {
      provide: { olMap: mapRef },
    },
  });

  const getSingleClickHandler = () =>
    fakeMap.on.mock.calls.find(([evt]) => evt === "singleclick")?.[1] as
      | ((_olEvent: { coordinate: number[]; pixel: number[] }) => void)
      | undefined;

  const fireClick = (
    coordinate: [number, number] = CLICK_COORDINATE,
    pixel: [number, number] = CLICK_PIXEL,
  ) => {
    const handler = getSingleClickHandler();
    expect(handler).toBeInstanceOf(Function);
    handler!({ coordinate, pixel });
  };

  return {
    wrapper,
    mapRef,
    fakeMap,
    onClick,
    fireClick,
    getSingleClickHandler,
  };
}

describe("useMapClickEvent", () => {
  describe("listener lifecycle", () => {
    it("registers a singleclick handler on the injected map", () => {
      const { fakeMap } = setup();

      expect(fakeMap.on).toHaveBeenCalledWith(
        "singleclick",
        expect.any(Function),
      );
    });

    it("does not register anything while the map is not available", () => {
      const onClick = vi.fn();

      const TestComponent = defineComponent({
        setup() {
          useMapClickEvent(onClick);
          return {};
        },
        template: "<div />",
      });

      mount(TestComponent, {
        global: { provide: { olMap: ref(undefined) } },
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it("unregisters the handler on unmount", () => {
      const { wrapper, fakeMap, getSingleClickHandler } = setup();
      const handler = getSingleClickHandler();

      wrapper.unmount();

      expect(fakeMap.un).toHaveBeenCalledWith("singleclick", handler);
    });

    it("cleans up the previous map and re-registers when the map instance changes", async () => {
      const { wrapper, mapRef, fakeMap, getSingleClickHandler } = setup();
      const firstHandler = getSingleClickHandler();

      const { fakeMap: secondFakeMap } = createFakeOlMap({
        view: { getResolution: vi.fn(() => 1) },
      });
      mapRef.value = secondFakeMap as unknown as OlMap;
      await nextTick();

      expect(fakeMap.un).toHaveBeenCalledWith("singleclick", firstHandler);
      expect(secondFakeMap.on).toHaveBeenCalledWith(
        "singleclick",
        expect.any(Function),
      );

      const secondHandler = secondFakeMap.on.mock.calls.find(
        ([evt]) => evt === "singleclick",
      )?.[1];

      wrapper.unmount();

      expect(secondFakeMap.un).toHaveBeenCalledWith(
        "singleclick",
        secondHandler,
      );
    });
  });

  describe("click payload", () => {
    it("builds a 10px extent box around the click coordinate using the view resolution", () => {
      const { onClick, fireClick } = setup({ resolution: 2 });

      fireClick();

      expect(onClick).toHaveBeenCalledTimes(1);
      const halfBox = IDENTIFY_TOLERANCE_PX * 2;
      const [x, y] = CLICK_COORDINATE;
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          extent: [x - halfBox, y - halfBox, x + halfBox, y + halfBox],
        }),
      );
    });

    it("passes coordinate, pixel and viewport size through", () => {
      const { onClick, fireClick } = setup({ size: [1024, 768] });

      fireClick([2600001, 1199999], [42, 24]);

      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinate: [2600001, 1199999],
          pixel: [42, 24],
          viewportSize: [1024, 768],
        }),
      );
    });

    it("falls back to a [0, 0] viewport size when the map has no size yet", () => {
      const { onClick, fireClick } = setup({ size: undefined });

      fireClick();

      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({ viewportSize: [0, 0] }),
      );
    });

    it("does not emit when the view has no resolution yet", () => {
      const { onClick, fireClick } = setup({ resolution: undefined });

      fireClick();

      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not emit from a stale handler once the map has been cleared", async () => {
      const { wrapper, mapRef, onClick, fireClick } = setup();

      mapRef.value = undefined;
      await nextTick();
      fireClick();

      expect(onClick).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("vector hit-test", () => {
    it("collects features within the extent as GeoJSON, keyed by layer uuid", () => {
      const inside = makePointFeature(2600000, 1200000);
      const farOutside = makePointFeature(2650000, 1250000);
      const otherLayerFeature = makePointFeature(2600005, 1200005);

      const { onClick, fireClick } = setup({
        layers: [
          makeVectorLayer({ uuid: "uuid-a", features: [inside, farOutside] }),
          makeVectorLayer({
            uuid: "uuid-b",
            features: [otherLayerFeature],
          }),
          // skipped: not a vector layer
          { get: () => "uuid-c" },
          // skipped: vector layer without uuid
          makeVectorLayer({ features: [makePointFeature(2600000, 1200000)] }),
          // skipped: vector layer without source
          makeVectorLayer({ uuid: "uuid-d", withSource: false }),
        ],
      });

      fireClick();

      const event = onClick.mock.calls[0]![0] as MapClickEvent;
      expect(Object.keys(event.vectorFeaturesPerLayer).sort()).toEqual([
        "uuid-a",
        "uuid-b",
      ]);

      const layerAFeatures = event.vectorFeaturesPerLayer["uuid-a"]!;
      expect(layerAFeatures).toHaveLength(1);
      expect(layerAFeatures[0]!.geometry).toEqual({
        type: "Point",
        coordinates: [2600000, 1200000],
      });

      const layerBFeatures = event.vectorFeaturesPerLayer["uuid-b"]!;
      expect(layerBFeatures).toHaveLength(1);
      expect(layerBFeatures[0]!.geometry).toEqual({
        type: "Point",
        coordinates: [2600005, 1200005],
      });
    });

    it("omits layers whose features all fall outside the click extent", () => {
      const { onClick, fireClick } = setup({
        layers: [
          makeVectorLayer({
            uuid: "uuid-far",
            features: [makePointFeature(2650000, 1250000)],
          }),
        ],
      });

      fireClick();

      const event = onClick.mock.calls[0]![0] as MapClickEvent;
      expect(event.vectorFeaturesPerLayer).toEqual({});
    });
  });
});
