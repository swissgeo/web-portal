import type { SingleCoordinate } from "@swissgeo/coordinates";

import { WGS84, LV03, WEBMERCATOR, constants } from "@swissgeo/coordinates";
import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach } from "vitest";

import usePositionStore, {
  DEFAULT_FORMAT,
  DEFAULT_PROJECTION,
} from "@/stores/position";
import { LV95Format, LV03Format } from "@/utils/coordinates/coordinateFormat";

const MIN_ZOOM = constants.SWISSTOPO_MIN_ZOOM_LEVEL;
const MAX_ZOOM = constants.SWISSTOPO_MAX_ZOOM_LEVEL;

describe("position store", () => {
  const mockDispatcher = { name: "test" };
  let store: ReturnType<typeof usePositionStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePositionStore();
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
    it("should set zoom to a valid value", () => {
      store.setZoom(5, mockDispatcher);
      expect(store.zoom).toEqual(5);
    });

    it("should not set zoom to an invalid value", () => {
      store.setZoom(-1, mockDispatcher);
      expect(store.zoom).not.toEqual(-1);
    });

    it("should not set zoom to a value greater than MAX_ZOOM", () => {
      store.setZoom(MAX_ZOOM + 1, mockDispatcher);
      expect(store.zoom).not.toEqual(MAX_ZOOM + 1);
    });

    it("should not set zoom to a value less than MIN_ZOOM", () => {
      store.setZoom(MIN_ZOOM - 1, mockDispatcher);
      expect(store.zoom).not.toEqual(MIN_ZOOM - 1);
    });
  });

  describe("increaseZoom", () => {
    it("should increase the zoom level by 1", () => {
      const initialZoom = store.zoom;
      store.increaseZoom(mockDispatcher);
      expect(store.zoom).toBe(initialZoom + 1);
    });

    it("should not be able to set zoom above MAX_ZOOM", () => {
      store.setZoom(MAX_ZOOM, mockDispatcher);
      store.increaseZoom(mockDispatcher);
      expect(store.zoom).toBe(MAX_ZOOM);
    });
  });

  describe("decreaseZoom", () => {
    it("should decrease the zoom level by 1", () => {
      store.setZoom(5, mockDispatcher);
      const initialZoom = store.zoom;
      store.decreaseZoom(mockDispatcher);
      expect(store.zoom).toBe(initialZoom - 1);
    });

    it("should not be able to set zoom below MIN_ZOOM", () => {
      store.setZoom(MIN_ZOOM, mockDispatcher);
      store.decreaseZoom(mockDispatcher);
      expect(store.zoom).toBe(MIN_ZOOM);
    });
  });

  describe("canIncreaseZoom", () => {
    it("should return true if zoom is less than MAX_ZOOM", () => {
      store.setZoom(MAX_ZOOM - 1, mockDispatcher);
      expect(store.canIncreaseZoom()).toBe(true);
    });

    it("should return false if zoom is equal to MAX_ZOOM", () => {
      store.setZoom(MAX_ZOOM, mockDispatcher);
      expect(store.canIncreaseZoom()).toBe(false);
    });
  });

  describe("canDecreaseZoom", () => {
    it("should return true if zoom is greater than MIN_ZOOM", () => {
      store.setZoom(MIN_ZOOM + 1, mockDispatcher);
      expect(store.canDecreaseZoom()).toBe(true);
    });

    it("should return false if zoom is equal to MIN_ZOOM", () => {
      store.setZoom(MIN_ZOOM, mockDispatcher);
      expect(store.canDecreaseZoom()).toBe(false);
    });
  });

  describe("setRotation", () => {
    it("should set rotation to a valid angle", () => {
      store.setRotation(Math.PI / 4, mockDispatcher);
      expect(store.rotation).toEqual(Math.PI / 4);
    });

    it("should normalize rotation when it exceeds the valid range", () => {
      store.setRotation(10 * Math.PI, mockDispatcher);
      expect(store.rotation).toEqual(0);
    });

    it("should not set rotation to NaN", () => {
      store.setRotation(NaN, mockDispatcher);
      expect(store.rotation).toEqual(0);
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
      store.setCenter([2600000, 1200000], mockDispatcher);
      expect(store.center).toEqual([2600000, 1200000]);
    });

    it("should not set center to an invalid LV95 coordinate", () => {
      store.setCenter([Infinity, -Infinity], mockDispatcher);
      expect(store.center).toEqual(DEFAULT_PROJECTION.bounds.center);
    });

    it("should not set center to an invalid format", () => {
      store.setCenter([6] as unknown as SingleCoordinate, mockDispatcher);
      expect(store.center).toEqual(DEFAULT_PROJECTION.bounds.center);
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
      store.$patch({ projectionEpsg: LV03.epsg, center: [600000, 200000] });
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });

    it("should return the center in EPSG:4326 for WGS84 (EPSG:4326)", () => {
      store.$patch({ projectionEpsg: WGS84.epsg, center: expected });
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });

    it("should return the center in EPSG:4326 for WebMercator (EPSG:3857)", () => {
      store.$patch({
        projectionEpsg: WEBMERCATOR.epsg,
        center: [828064.72, 5934093.22],
      });
      const result = store.centerEpsg4326;
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    });
  });

  describe("$reset", () => {
    it("should reset the store to its initial state", () => {
      store.$patch({
        center: [600000, 200000],
        zoom: 5,
        rotation: 45,
      });
      store.setDisplayedFormat(LV03Format, mockDispatcher);

      expect(store.center).toEqual([600000, 200000]);
      expect(store.zoom).toBe(5);
      expect(store.rotation).toBe(45);
      expect(store.displayFormat.id).toBe("LV03");

      store.$reset(mockDispatcher);

      expect(store.center).toEqual(DEFAULT_PROJECTION.bounds.center);
      expect(store.zoom).toBe(DEFAULT_PROJECTION.getDefaultZoom());
      expect(store.rotation).toBe(0);
      expect(store.displayFormat.id).toBe(DEFAULT_FORMAT.id);
    });
  });

  describe("resolution", () => {
    it("should return the resolution for the current zoom and center", () => {
      store.$patch({ zoom: 3, center: [0, 0] });
      expect(store.resolution).toBe(100);
    });
  });

  describe("non-SwissCoordinateSystem projections", () => {
    it("should increase zoom level by 1 for non-SwissCoordinateSystem projections", () => {
      store.$patch({ projectionEpsg: WGS84.epsg });
      const initialZoom = store.zoom;
      store.increaseZoom(mockDispatcher);
      expect(store.zoom).toBe(initialZoom + 1);
    });

    it("should decrease zoom level by 1 for non-SwissCoordinateSystem projections", () => {
      store.$patch({ projectionEpsg: WGS84.epsg });
      store.setZoom(5, mockDispatcher); // So that we are not at the minimum zoom level (which is the default zoom level)
      const initialZoom = store.zoom;
      store.decreaseZoom(mockDispatcher);
      expect(store.zoom).toBe(initialZoom - 1);
    });
  });

  describe("SSR payload safety", () => {
    const isPlainValue = (value: unknown): boolean => {
      if (
        value === null ||
        ["string", "number", "boolean", "undefined", "bigint"].includes(
          typeof value,
        )
      ) {
        return true;
      }
      if (Array.isArray(value)) {
        return value.every(isPlainValue);
      }
      if (typeof value === "object") {
        const proto = Object.getPrototypeOf(value);
        if (proto !== Object.prototype && proto !== null) {
          return false;
        }
        return Object.values(value).every(isPlainValue);
      }
      return false;
    };

    it("should only keep plain values in $state (devalue/Nuxt payload safety)", () => {
      expect(isPlainValue(store.$state)).toBe(true);
    });

    it("should not expose projection or displayFormat as state", () => {
      expect(store.$state).not.toHaveProperty("projection");
      expect(store.$state).not.toHaveProperty("displayFormat");
    });
  });
});
