import type { CoordinateSystem } from "@swissgeo/coordinates";

import { LV95 } from "@swissgeo/coordinates";
import { defineStore } from "pinia";

import type {
  PositionStoreGetters,
  PositionStoreState,
} from "@/stores/position/types/position";

import decreaseZoom from "@/stores/position/actions/decreaseZoom";
import increaseZoom from "@/stores/position/actions/increaseZoom";
import setAutoRotation from "@/stores/position/actions/setAutoRotation";
import setCenter from "@/stores/position/actions/setCenter";
import setDisplayedFormat from "@/stores/position/actions/setDisplayedFormat";
import setRotation from "@/stores/position/actions/setRotation";
import setZoom from "@/stores/position/actions/setZoom";
import centerEpsg4326 from "@/stores/position/getters/centerEpsg4326";
import { LV95Format } from "@/utils/coordinates/coordinateFormat";

/** Default projection to be used throughout the application */
export const DEFAULT_PROJECTION: CoordinateSystem = LV95;
export const DEFAULT_FORMAT = LV95Format;

const state = (): PositionStoreState => ({
  displayFormat: DEFAULT_FORMAT,

  zoom: DEFAULT_PROJECTION.getDefaultZoom(),
  rotation: 0,
  autoRotation: false,
  center: DEFAULT_PROJECTION.bounds.center,
  projection: DEFAULT_PROJECTION,
});

import resolution from "@/stores/position/getters/resolution";

import $reset from "./actions/$reset";

const getters: PositionStoreGetters = {
  centerEpsg4326,
  resolution,
};

const actions = {
  setDisplayedFormat,
  setZoom,
  increaseZoom,
  decreaseZoom,
  setRotation,
  setAutoRotation,
  setCenter,
  $reset,
};

const usePositionStore = defineStore("position", {
  state,
  getters: { ...getters },
  actions,
});

export default usePositionStore;

export type PositionStore = ReturnType<typeof usePositionStore>;
