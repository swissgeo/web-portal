import type { SingleCoordinate } from "@swissgeo/coordinates";

import { WGS84, LV03, WEBMERCATOR, constants } from "@swissgeo/coordinates";
import { flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach, vi } from "vitest";

import usePositionStore, {
  DEFAULT_FORMAT,
  DEFAULT_PROJECTION,
} from "@/stores/position";
import { LV95Format, LV03Format } from "@/utils/coordinates/coordinateFormat";

const MIN_ZOOM = constants.SWISSTOPO_MIN_ZOOM_LEVEL;
const MAX_ZOOM = constants.SWISSTOPO_MAX_ZOOM_LEVEL;

const {
  animateMock,
  centerMock,
  zoomMock,
  rotationMock,
  getViewMock,
  olMapMock,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");

  const getViewMock = vi.fn(() => ({
    animate: animateMock,
    getCenter: vi.fn(() => [2660000, 1190000]),
    getZoom: vi.fn(() => 1),
    getRotation: vi.fn(() => 1),
    on: vi.fn(() => true),
  }));

  const olMapMock = ref({
    getView: getViewMock,
    setView: vi.fn(),
    on: (_: string, callback: () => boolean) => callback(),
  });

  return {
    olMapMock: olMapMock,
    animateMock: vi.fn(),
    centerMock: ref([2660000, 1190000]),
    zoomMock: ref(1),
    rotationMock: ref(0),
    getViewMock,
  };
});

vi.mock("@/stores/map", () => ({
  useMapStore: () => ({
    get olMap() {
      return olMapMock.value;
    },
  }),
}));

vi.mock("@/composables/useOlMapPosition", () => ({
  useOlMapPosition: () => ({
    zoom: zoomMock,
    center: centerMock,
    rotation: rotationMock,
  }),
}));

describe("position store", () => {
  const mockDispatcher = { name: "test" };
  let store: ReturnType<typeof usePositionStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePositionStore();

    animateMock.mockClear();
  });

  describe("initial state", () => {
    it("should have default values", () => {
      expect(store.displayFormat.id).toBe(DEFAULT_FORMAT.id);
      expect(store.zoom).toBe(DEFAULT_PROJECTION.getDefaultZoom());
      expect(store.rotation).toBe(0);
      expect(store.autoRotation).toBe(false);
      expect(store.center).toEqual(DEFAULT_PROJECTION.bounds.center);
      expect(store.projection.epsg).toBe(DEFAULT_PROJECTION.epsg);
    });
  });

  describe("setZoom", () => {
    it("should set openlayers zoom to a valid value", () => {
      const result = store.setZoom(5, mockDispatcher);
      expect(result).toBe(true);
      expect(animateMock).toHaveBeenCalledWith({ zoom: 5, duration: 200 });
    });

    it("should not set openlayers zoom to an invalid value", () => {
      const result = store.setZoom(-1, mockDispatcher);
      expect(result).toBe(false);
      expect(store.zoom).not.toEqual(-1);
    });

    it("should not set zoom to a value greater than MAX_ZOOM", () => {
      const result = store.setZoom(MAX_ZOOM + 1, mockDispatcher);
      expect(result).toBe(false);
      expect(store.zoom).not.toEqual(MAX_ZOOM + 1);
    });

    it("should not set zoom to a value less than MIN_ZOOM", () => {
      const result = store.setZoom(MIN_ZOOM - 1, mockDispatcher);
      expect(result).toBe(false);
      expect(store.zoom).not.toEqual(MIN_ZOOM - 1);
    });

    it("should return immediately when there is no view available", () => {
      getViewMock.mockReturnValueOnce(null);
      const result = store.setZoom(5, mockDispatcher);
      expect(result).toBe(false);
      expect(animateMock).not.toHaveBeenCalled();
    });
  });

  describe("increaseZoom", () => {
    it("should increase the zoom level by 1", () => {
      const initialZoom = store.zoom;
      store.increaseZoom(mockDispatcher);
      expect(animateMock).toHaveBeenCalledWith({
        zoom: initialZoom + 1,
        duration: 200,
      });
    });

    it("should not be able to set zoom above MAX_ZOOM", () => {
      zoomMock.value = MAX_ZOOM;
      store.increaseZoom(mockDispatcher);
      // it does not go above MAX_ZOOM
      expect(animateMock).toHaveBeenCalledWith({
        zoom: MAX_ZOOM,
        duration: 200,
      });
    });

    it("It should not increase zoom when zoom isn't initialized", () => {
      zoomMock.value = undefined;
      store.increaseZoom(mockDispatcher);
      // it does not go above MAX_ZOOM
      expect(animateMock).not.toHaveBeenCalled();
    });
  });

  describe("decreaseZoom", () => {
    it("should decrease the zoom level by 1", () => {
      zoomMock.value = 5;
      store.decreaseZoom(mockDispatcher);
      expect(animateMock).toHaveBeenCalledWith({ zoom: 4, duration: 200 });
    });

    it("should not be able to set zoom below MIN_ZOOM", () => {
      zoomMock.value = MIN_ZOOM;
      store.decreaseZoom(mockDispatcher);
      expect(animateMock).toHaveBeenCalledWith({
        zoom: MIN_ZOOM,
        duration: 200,
      });
    });

    it("It should not decrease zoom when zoom isn't initialized", () => {
      zoomMock.value = undefined;
      store.decreaseZoom(mockDispatcher);
      // it does not go above MAX_ZOOM
      expect(animateMock).not.toHaveBeenCalled();
    });
  });

  describe("canIncreaseZoom", () => {
    it("should return true if zoom is less than MAX_ZOOM", () => {
      zoomMock.value = MAX_ZOOM - 1;
      expect(store.canIncreaseZoom()).toBe(true);
    });

    it("should return false if zoom is equal to MAX_ZOOM", () => {
      zoomMock.value = MAX_ZOOM;
      expect(store.canIncreaseZoom()).toBe(false);
    });
  });

  describe("canDecreaseZoom", () => {
    it("should return true if zoom is greater than MIN_ZOOM", () => {
      zoomMock.value = MIN_ZOOM + 1;
      expect(store.canDecreaseZoom()).toBe(true);
    });

    it("should return false if zoom is equal to MIN_ZOOM", () => {
      zoomMock.value = MIN_ZOOM;
      expect(store.canDecreaseZoom()).toBe(false);
    });
  });

  describe("setRotation", () => {
    it("should set rotation to a valid angle", () => {
      const result = store.setRotation(Math.PI / 4, mockDispatcher);
      expect(result).toBe(true);
      expect(animateMock).toHaveBeenCalledWith({
        rotation: Math.PI / 4,
        duration: 200,
      });
    });

    it("should normalize rotation when it exceeds the valid range", () => {
      const result = store.setRotation(10 * Math.PI, mockDispatcher);
      expect(result).toBe(true);
      expect(animateMock).toHaveBeenCalledWith({
        rotation: 0,
        duration: 200,
      });
    });

    it("should not set rotation to NaN", () => {
      const result = store.setRotation(NaN, mockDispatcher);
      expect(result).toBe(false);
      expect(animateMock).not.toHaveBeenCalled();
    });

    it("should not set rotation to OL if view isn't available", () => {
      getViewMock.mockReturnValueOnce(null);
      const result = store.setRotation(Math.PI / 4, mockDispatcher);
      expect(result).toBe(false);
      expect(animateMock).not.toHaveBeenCalled();
    });
  });

  describe("setAutoRotation", () => {
    it("should set autoRotation to true", () => {
      store.setAutoRotation(true, mockDispatcher);
      expect(store.autoRotation).toBe(true);
    });

    it("should set autoRotation to false", () => {
      store.setAutoRotation(false, mockDispatcher);
      expect(store.autoRotation).toBe(false);
    });
  });

  describe("setCenter", () => {
    it("should set center to a valid LV95 coordinate", () => {
      const result = store.setCenter([2600000, 1200000], mockDispatcher);
      expect(result).toBe(true);
      expect(animateMock).toHaveBeenCalledWith({
        center: [2600000, 1200000],
        duration: 200,
      });
    });

    it("should not set center to an invalid LV95 coordinate", () => {
      const result = store.setCenter([Infinity, -Infinity], mockDispatcher);
      expect(result).toBe(false);
      expect(animateMock).not.toHaveBeenCalled();
    });

    it("should not set center to an invalid format", () => {
      const result = store.setCenter(
        [6] as unknown as SingleCoordinate,
        mockDispatcher,
      );
      expect(result).toBe(false);
      expect(animateMock).not.toHaveBeenCalled();
    });

    it("should not set center to OL if view isn't available", () => {
      getViewMock.mockReturnValueOnce(null);
      const result = store.setCenter([2600000, 1200000], mockDispatcher);
      expect(result).toBe(false);
      expect(animateMock).not.toHaveBeenCalled();
    });
  });

  describe("setDisplayedFormat", () => {
    it("should set displayedFormat to LV95Format", () => {
      store.setDisplayedFormat(LV95Format, mockDispatcher);
      expect(store.displayFormat).toEqual(LV95Format);
    });

    it("should set displayedFormat to LV03Format", () => {
      store.setDisplayedFormat(LV03Format, mockDispatcher);
      expect(store.displayFormat).toEqual(LV03Format);
    });
  });

  describe("centerEpsg4326", () => {
    const expected: [number, number] = [7.438632, 46.951083];

    it("should return the center in EPSG:4326 for LV95 (EPSG:2056)", () => {
      store.$patch({ center: [2600000, 1200000] });
      expect(store.center).toEqual([2600000, 1200000]);
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });

    it("should return the center in EPSG:4326 for LV03 (EPSG:21781)", () => {
      store.$patch({ projection: LV03, center: [600000, 200000] });
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });

    it("should return the center in EPSG:4326 for WGS84 (EPSG:4326)", () => {
      store.$patch({ projection: WGS84, center: expected });
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });

    it("should return the center in EPSG:4326 for WebMercator (EPSG:3857)", () => {
      store.$patch({
        projection: WEBMERCATOR,
        center: [828064.72, 5934093.22],
      });
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });

    it("should return undefined if center is undefined", () => {
      store.$patch({ center: undefined });
      const result = store.centerEpsg4326;
      expect(result).toBe(undefined);
    });
  });

  describe("$reset", () => {
    it("should reset the store to its initial state", async () => {
      centerMock.value = [600000, 200000];
      zoomMock.value = 5;
      rotationMock.value = 45;

      await flushPromises();

      expect(store.center).toEqual([600000, 200000]);
      expect(store.zoom).toBe(5);
      expect(store.rotation).toBe(45);

      store.$reset(mockDispatcher);

      expect(animateMock).toHaveBeenCalledWith({
        center: DEFAULT_PROJECTION.bounds.center,
        duration: 200,
      });
      expect(animateMock).toHaveBeenCalledWith({
        zoom: DEFAULT_PROJECTION.getDefaultZoom(),
        duration: 200,
      });
      expect(animateMock).toHaveBeenCalledWith({ rotation: 0, duration: 200 });
    });
  });

  describe("resolution", () => {
    it("should return the resolution for the current zoom and center", () => {
      store.$patch({ zoom: 3, center: [0, 0] });
      expect(store.resolution).toBe(100);
    });

    it("should return undefined if zoom is undefined", () => {
      store.$patch({ zoom: undefined });
      expect(store.resolution).toBe(undefined);
    });

    it("should return undefined if center is undefined", () => {
      store.$patch({ center: undefined });
      expect(store.resolution).toBe(undefined);
    });
  });

  describe("non-SwissCoordinateSystem projections", () => {
    it("should increase zoom level by 1 for non-SwissCoordinateSystem projections", () => {
      store.$patch({ projection: WGS84, zoom: 8 });
      store.increaseZoom(mockDispatcher);
      expect(animateMock).toHaveBeenCalledWith({ zoom: 9, duration: 200 });
    });

    it("should decrease zoom level by 1 for non-SwissCoordinateSystem projections", () => {
      store.$patch({ projection: WGS84, zoom: 5 });
      store.decreaseZoom(mockDispatcher);
      expect(animateMock).toHaveBeenCalledWith({ zoom: 4, duration: 200 });
    });
  });

  describe("zoom/rotation/center caching before map is available", () => {
    it("should cache the zoom when map isn't available and apply it when it becomes available", async () => {
      olMapMock.value = null; // simulate map not available
      zoomMock.value = 1; // initialise the default

      const result = store.setZoom(7.2, mockDispatcher);
      expect(result).toBe(false);
      expect(store.zoom).toEqual(1); // still the default

      olMapMock.value = {
        getView: getViewMock,
        setView: vi.fn(() => {}),
        on: (_, callback) => callback(),
      };
      await flushPromises();

      expect(animateMock).toHaveBeenCalledWith({ zoom: 7.2, duration: 200 });
    });

    it("should cache the center when map isn't available and apply it when it becomes available", async () => {
      olMapMock.value = null; // simulate map not available
      centerMock.value = [2660000, 1190000]; // initialise the default

      // operating on wgs84 here since we're using defaults
      const result = store.setCenter([46.935449, 7.399938], mockDispatcher);
      expect(result).toBe(false);
      expect(store.center).toEqual([2660000, 1190000]); // still the default

      olMapMock.value = {
        getView: getViewMock,
        setView: vi.fn(() => {}),
        on: (_, callback) => callback(),
      };
      await flushPromises();

      expect(animateMock).toHaveBeenCalledWith({
        center: [46.935449, 7.399938],
        duration: 200,
      });
    });

    it("should cache the rotation when map isn't available and apply it when it becomes available", async () => {
      olMapMock.value = null; // simulate map not available
      rotationMock.value = 0; // initialise the default

      const result = store.setRotation(Math.PI / 4, mockDispatcher);
      expect(result).toBe(false);
      expect(store.rotation).toEqual(0); // still the default

      olMapMock.value = {
        getView: getViewMock,
        setView: vi.fn(() => {}),
        on: (_, callback) => callback(),
      };
      await flushPromises();

      expect(animateMock).toHaveBeenCalledWith({
        rotation: Math.PI / 4,
        duration: 200,
      });
    });

    it.only("should cache the position when map is alread available but without view", async () => {
      // @ts-expect-error Using an extended version of the olMapMock interface that still
      // mocks the olMap interface but adds a `setView` method
      olMapMock.value = new (class {
        changeViewCallback: null | (() => boolean) = null;
        view: ReturnType<typeof getViewMock> = null;
        getView() {
          return this.view;
        }
        setView(view: ReturnType<typeof getViewMock>) {
          this.view = view;
          this.changeViewCallback();
        }
        on(_: string, callback: () => boolean) {
          this.changeViewCallback = callback;
        }
      })(); // simulate view not available

      zoomMock.value = 1; // initialise the default
      await flushPromises();

      store.setZoom(7.2, mockDispatcher);
      store.setCenter([46.967583, 7.359163], mockDispatcher);
      store.setRotation(0.2, mockDispatcher);

      // we're still on the defaults of useOlMapPosition
      expect(store.zoom).toEqual(1);
      expect(store.center).toEqual([2660000, 1190000]);
      expect(store.rotation).toEqual(0);

      olMapMock.value.setView(getViewMock());
      await flushPromises();

      expect(animateMock).toHaveBeenCalledWith({ zoom: 7.2, duration: 200 });
      expect(animateMock).toHaveBeenCalledWith({
        center: [46.967583, 7.359163],
        duration: 200,
      });
      expect(animateMock).toHaveBeenCalledWith({
        rotation: 0.2,
        duration: 200,
      });
    });
  });
});
