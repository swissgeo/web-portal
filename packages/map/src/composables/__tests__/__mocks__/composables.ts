import type { CoordinateSystem } from "@swissgeo/coordinates";

import { vi } from "vitest";
import { computed, shallowRef } from "vue";

type Handler = (...args: unknown[]) => void;

export const mockAddLayerToMap = vi.fn();
export const mockRemoveLayerFromMap = vi.fn();
export const mockSetVisibility = vi.fn();
export const mockSetZIndex = vi.fn();
export const mockSetOpacity = vi.fn();

export const useAddLayerToMapSpy = vi.fn(() => ({
  addLayerToMap: mockAddLayerToMap,
  removeLayerFromMap: mockRemoveLayerFromMap,
  setVisibility: mockSetVisibility,
  setZIndex: mockSetZIndex,
  setOpacity: mockSetOpacity,
}));

export function clearAddLayerToMapMocks() {
  mockAddLayerToMap.mockClear();
  mockRemoveLayerFromMap.mockClear();
  mockSetVisibility.mockClear();
  mockSetZIndex.mockClear();
  mockSetOpacity.mockClear();
  useAddLayerToMapSpy.mockClear();
}

export const mockPositionStore = {
  projection: {
    epsg: "EPSG:2056",
    usesMercatorPyramid: true,
    roundZoomLevel: (z: number) => z,
    bounds: {
      flatten: [2420000, 1030000, 2900000, 1350000] as [
        number,
        number,
        number,
        number,
      ],
      center: [2660000, 1190000] as [number, number],
    },
    getDefaultZoom: () => 10,
    getResolutionSteps: () => [] as number[],
    getTileOrigin: () => [2420000, 1350000] as [number, number],
    proj4transformationMatrix: "+proj=somerc ...",
  } as unknown as CoordinateSystem,
  center: [2660000, 1190000] as [number, number],
  zoom: 10,
  rotation: 0,
  autoRotation: false,
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  setRotation: vi.fn(),
  setAutoRotation: vi.fn(),
  setDisplayedFormat: vi.fn(),
};

export const mockDrawingVectorLayer = shallowRef({
  setSource: vi.fn(),
  getSource: vi.fn(() => ({ clear: vi.fn() })),
});

export const mockDrawinG_LAYER_UUID = "drawing-layer-uuid";

export const mockMapStore = {
  olMap: shallowRef(null),
  isMapLoaded: computed(() => false),
};

export function createFakeOlMap(
  overrides: {
    view?: Record<string, unknown>;
    map?: Record<string, unknown>;
  } = {},
) {
  const layers: unknown[] = [];
  const viewListeners: Record<string, Handler[]> = {};
  const mapListeners: Record<string, Handler[]> = {};

  const fakeView = {
    getZoom: vi.fn(() => 10),
    getCenter: vi.fn(() => [2660000, 1190000]),
    getRotation: vi.fn(() => 0),
    calculateExtent: vi.fn(() => [0, 0, 1000, 1000]),
    animate: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    on: vi.fn((event: string, handler: Handler) => {
      if (!viewListeners[event]) {
        viewListeners[event] = [];
      }
      viewListeners[event].push(handler);
    }),
    ...overrides.view,
  };

  const fakeMap = {
    getView: vi.fn(() => fakeView),
    setView: vi.fn(),
    getSize: vi.fn(() => [1000, 1000]),
    addLayer: vi.fn((layer: unknown) => {
      layers.push(layer);
    }),
    removeLayer: vi.fn((layer: unknown) => {
      const idx = layers.indexOf(layer);
      if (idx !== -1) {
        layers.splice(idx, 1);
      }
      return layer;
    }),
    getAllLayers: vi.fn(() => layers),
    on: vi.fn((event: string, handler: Handler) => {
      if (!mapListeners[event]) {
        mapListeners[event] = [];
      }
      mapListeners[event].push(handler);
    }),
    un: vi.fn((event: string, handler: Handler) => {
      const handlers = mapListeners[event];
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) {
          handlers.splice(idx, 1);
        }
      }
    }),
    addInteraction: vi.fn(),
    removeInteraction: vi.fn(),
    getViewport: vi.fn(() => document.createElement("div")),
    getEventPixel: vi.fn(() => [500, 500]),
    getCoordinateFromPixel: vi.fn(() => [2660000, 1190000]),
    getView_: fakeView,
    ...overrides.map,
  };

  return { fakeMap, fakeView, layers, viewListeners, mapListeners };
}
