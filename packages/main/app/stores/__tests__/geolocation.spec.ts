import type { SingleCoordinate } from "@swissgeo/coordinates";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { LV95, WGS84, registerProj4 } from "@swissgeo/coordinates";
import { useGeolocationStore } from "~/stores/geolocation";
import { createPinia, setActivePinia } from "pinia";
import proj4 from "proj4";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Register Swiss projections so proj4 can convert WGS84 ↔ LV95 in tests
registerProj4(proj4);

// --- Hoisted mock primitives (must exist before vi.mock hoisting) ---

const { mockSetCenter, mockSetZoom, mockToastAdd } = vi.hoisted(() => ({
  mockSetCenter: vi.fn(),
  mockSetZoom: vi.fn(),
  mockToastAdd: vi.fn(),
}));

// --- Module mocks ---

// Stub the auto-imported `useToaster` composable. The geolocation store uses
// showWarning/showError, and the mock routes their message argument into a
// {title, color} shape so the existing toast assertions still match.
mockNuxtImport("useToaster", () => () => ({
  showWarning: (message: string) =>
    mockToastAdd({ title: message, color: "warning" }),
  showError: (message: string) =>
    mockToastAdd({ title: message, color: "error" }),
  showSuccess: (message: string) =>
    mockToastAdd({ title: message, color: "success" }),
}));

// Return the i18n key, so the tests can check which message the store shows.
mockNuxtImport("useNuxtApp", () => () => ({
  $i18n: { t: (key: string) => key },
}));

vi.mock("@swissgeo/map", async () => {
  const { LV95 } = await import("@swissgeo/coordinates");
  return {
    usePositionStore: () => ({
      projection: LV95,
      // The mock centre never changes — deliberately, to keep setCenterIfInBounds
      // always calling setCenter (isEqual check will always be false).
      center: LV95.bounds.center,
      setCenter: mockSetCenter,
      setZoom: mockSetZoom,
    }),
  };
});

// --- Geolocation API mocks ---

const mockGetCurrentPosition = vi.fn();
const mockWatchPosition = vi.fn();
const mockClearWatch = vi.fn();

function makeGeolocationPosition(
  lat: number,
  lon: number,
  accuracy = 10,
): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lon,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as unknown as GeolocationPosition;
}

function makeGeolocationError(code: number): GeolocationPositionError {
  return {
    code,
    message: "test error",
    PERMISSION_DENIED: GEOLOCATION_PERMISSION_DENIED,
    POSITION_UNAVAILABLE: GEOLOCATION_POSITION_UNAVAILABLE,
    TIMEOUT: GEOLOCATION_TIMEOUT,
  } as GeolocationPositionError;
}

// A Swiss position near Bern, well within LV95 bounds
const swissLat = 46.948;
const swissLon = 7.447;
const [swissX, swissY]: SingleCoordinate = proj4(WGS84.epsg, LV95.epsg, [
  swissLon,
  swissLat,
]);

// A position clearly outside Switzerland (null island)
const outsideLat = 0;
const outsideLon = 0;

// GeolocationPositionError constants — not available in jsdom
const GEOLOCATION_PERMISSION_DENIED = 1;
const GEOLOCATION_POSITION_UNAVAILABLE = 2;
const GEOLOCATION_TIMEOUT = 3;

const dispatcher = { name: "test" };
const WATCHER_ID = 42;

// ---------------------------------------------------------------------------

describe("geolocation store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    Object.defineProperty(global.navigator, "geolocation", {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
        watchPosition: mockWatchPosition,
        clearWatch: mockClearWatch,
      },
      configurable: true,
      writable: true,
    });

    // Default: getCurrentPosition calls success synchronously with a Swiss position
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
      success(makeGeolocationPosition(swissLat, swissLon));
    });
    mockWatchPosition.mockReturnValue(WATCHER_ID);
  });

  // -----------------------------------------------------------------------
  // setGeolocationActive
  // -----------------------------------------------------------------------

  describe("setGeolocationActive", () => {
    it("sets active to true when activated", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(store.active).toBe(true);
    });

    it("sets active to false when deactivated", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      store.setGeolocationActive(false, dispatcher);
      expect(store.active).toBe(false);
    });

    it("calls navigator.geolocation.getCurrentPosition on activation", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(mockGetCurrentPosition).toHaveBeenCalledOnce();
    });

    it("registers a position watcher after getting the current position", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(mockWatchPosition).toHaveBeenCalledOnce();
    });

    it("clears the position watcher when deactivated", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      store.setGeolocationActive(false, dispatcher);
      expect(mockClearWatch).toHaveBeenCalledWith(WATCHER_ID);
    });

    it("resets errorCount on each activation", () => {
      const store = useGeolocationStore();
      store.errorCount = 5;
      store.setGeolocationActive(true, dispatcher);
      expect(store.errorCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // toggleGeolocation
  // -----------------------------------------------------------------------

  describe("toggleGeolocation", () => {
    it("activates geolocation when currently inactive", () => {
      const store = useGeolocationStore();
      store.toggleGeolocation(dispatcher);
      expect(store.active).toBe(true);
    });

    it("deactivates geolocation when currently active", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      store.toggleGeolocation(dispatcher);
      expect(store.active).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Position handling — inside Switzerland
  // -----------------------------------------------------------------------

  describe("position handling — inside Switzerland", () => {
    it("updates the store position with LV95-projected coordinates", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(store.position).toBeDefined();
      expect(store.position![0]).toBeCloseTo(swissX, 0);
      expect(store.position![1]).toBeCloseTo(swissY, 0);
    });

    it("centers the map on activation", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(store.tracking).toBe(true);
      expect(mockSetCenter).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.closeTo(swissX, 0),
          expect.closeTo(swissY, 0),
        ]),
        dispatcher,
      );
    });

    it("sets optimal zoom (1:25 000) on the first activation", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(mockSetZoom).toHaveBeenCalledWith(
        LV95.get1_25000ZoomLevel(),
        dispatcher,
      );
    });

    it("centers the map but does not set zoom again on the next activation", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher); // firstTime → false
      store.setGeolocationActive(false, dispatcher);
      vi.clearAllMocks();

      store.setGeolocationActive(true, dispatcher);

      expect(mockSetCenter).toHaveBeenCalled();
      expect(mockSetZoom).not.toHaveBeenCalled();
    });

    it("does not move the map on a new position after tracking is turned off", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      store.setGeolocationTracking(false, dispatcher);
      const onWatchSuccess: PositionCallback =
        mockWatchPosition.mock.calls[0]![0];
      vi.clearAllMocks();

      onWatchSuccess(makeGeolocationPosition(swissLat + 0.01, swissLon));

      expect(mockSetCenter).not.toHaveBeenCalled();
      expect(store.position![1]).toBeGreaterThan(swissY);
    });

    it("rounds the accuracy to the nearest meter", () => {
      mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
        success(makeGeolocationPosition(swissLat, swissLon, 150.7));
      });
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      expect(store.accuracy).toBe(151);
    });
  });

  // -----------------------------------------------------------------------
  // Position handling — outside Switzerland
  // -----------------------------------------------------------------------

  describe("position handling — outside Switzerland", () => {
    beforeEach(() => {
      mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
        success(makeGeolocationPosition(outsideLat, outsideLon));
      });
    });

    it("shows an out-of-bounds error toast when tracking is enabled", () => {
      const store = useGeolocationStore();
      store.tracking = true;
      store.setGeolocationActive(true, dispatcher);
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "geolocation.outsideSwitzerland",
        }),
      );
    });

    it("shows the out-of-bounds warning only once while the position updates", () => {
      mockWatchPosition.mockImplementation((success: PositionCallback) => {
        success(makeGeolocationPosition(outsideLat, outsideLon));
        success(makeGeolocationPosition(outsideLat + 0.001, outsideLon));
        return 1;
      });
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);

      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(store.tracking).toBe(false);
    });

    it("does not call setCenter via setCenterIfInBounds for out-of-bounds coordinates", () => {
      const store = useGeolocationStore();
      store.tracking = true;
      store.setGeolocationActive(true, dispatcher);
      expect(mockToastAdd).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Tracking
  // -----------------------------------------------------------------------

  describe("setGeolocationTracking", () => {
    it("disables tracking", () => {
      const store = useGeolocationStore();
      store.setGeolocationTracking(false, dispatcher);
      expect(store.tracking).toBe(false);
    });

    it("re-enables tracking and re-centers when a position is already known", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher); // acquires position
      store.setGeolocationTracking(false, dispatcher);
      vi.clearAllMocks();

      store.setGeolocationTracking(true, dispatcher);

      expect(store.tracking).toBe(true);
      expect(mockSetCenter).toHaveBeenCalled();
    });

    it("enables tracking without centering when no position is known yet", () => {
      const store = useGeolocationStore();
      store.setGeolocationTracking(false, dispatcher);
      store.setGeolocationTracking(true, dispatcher);
      expect(mockSetCenter).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // setGeolocationDenied
  // -----------------------------------------------------------------------

  describe("setGeolocationDenied", () => {
    it("sets the denied flag", () => {
      const store = useGeolocationStore();
      store.setGeolocationDenied(true, dispatcher);
      expect(store.denied).toBe(true);
    });

    it("deactivates geolocation when denied", () => {
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      store.setGeolocationDenied(true, dispatcher);
      expect(store.active).toBe(false);
    });

    it("also disables tracking when denied", () => {
      const store = useGeolocationStore();
      store.setGeolocationDenied(true, dispatcher);
      expect(store.tracking).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe("error handling", () => {
    it("sets denied=true and shows permission toast on PERMISSION_DENIED", () => {
      mockGetCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(makeGeolocationError(GEOLOCATION_PERMISSION_DENIED));
        },
      );
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);

      expect(store.denied).toBe(true);
      expect(store.active).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "geolocation.permissionDenied",
        }),
      );
    });

    it("deactivates and shows timeout toast on TIMEOUT", () => {
      mockGetCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(makeGeolocationError(GEOLOCATION_TIMEOUT));
        },
      );
      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);

      expect(store.active).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "geolocation.timeout",
        }),
      );
    });

    it("shows an unknown-error toast after 3 consecutive watchPosition failures", () => {
      // Capture the watchPosition error callback so we can trigger it manually
      let watchError: PositionErrorCallback | undefined;
      mockWatchPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          watchError = error;
          return WATCHER_ID;
        },
      );

      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);

      const unknownError = makeGeolocationError(
        GEOLOCATION_POSITION_UNAVAILABLE,
      );
      watchError!(unknownError); // errorCount → 1, no toast
      watchError!(unknownError); // errorCount → 2, no toast
      watchError!(unknownError); // errorCount → 3, toast shown

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "geolocation.unavailable" }),
      );
    });

    it("does not show unknown-error toast before 3 failures", () => {
      let watchError: PositionErrorCallback | undefined;
      mockWatchPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          watchError = error;
          return WATCHER_ID;
        },
      );

      const store = useGeolocationStore();
      store.setGeolocationActive(true, dispatcher);
      vi.clearAllMocks();

      const unknownError = makeGeolocationError(
        GEOLOCATION_POSITION_UNAVAILABLE,
      );
      watchError!(unknownError); // errorCount → 1
      watchError!(unknownError); // errorCount → 2

      expect(mockToastAdd).not.toHaveBeenCalled();
    });
  });
});
