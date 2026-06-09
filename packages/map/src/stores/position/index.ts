import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";

import { LV95 } from "@swissgeo/coordinates";
import { defineStore, type StoreDefinition } from "pinia";

import type {
  PositionStoreGetters,
  PositionStoreState,
} from "@/stores/position/types/position";
import type { CoordinateFormat } from "@/utils/coordinates/coordinateFormat";

import decreaseZoom from "@/stores/position/actions/decreaseZoom";
import increaseZoom from "@/stores/position/actions/increaseZoom";
import setAutoRotation from "@/stores/position/actions/setAutoRotation";
// import setCameraPosition from "@/stores/position/actions/setCameraPosition";
import setCenter from "@/stores/position/actions/setCenter";
// import setCrossHair from "@/stores/position/actions/setCrossHair";
import setDisplayedFormat from "@/stores/position/actions/setDisplayedFormat";
// import setHasOrientation from "@/stores/position/actions/setHasOrientation";
// import setProjection from '@/stores/position/actions/setProjection'
import setRotation from "@/stores/position/actions/setRotation";
import setZoom from "@/stores/position/actions/setZoom";
// import zoomToExtent from "@/stores/position/actions/zoomToExtent";
import centerEpsg4326 from "@/stores/position/getters/centerEpsg4326";
import { LV95Format } from "@/utils/coordinates/coordinateFormat";
// import extent from "@/stores/position/getters/extent";
// import isExtentOnlyWithinLV95Bounds from "@/stores/position/getters/isExtentOnlyWithinLV95Bounds";
// import resolution from "@/stores/position/getters/resolution";

/** Default projection to be used throughout the application */
export const DEFAULT_PROJECTION: CoordinateSystem = LV95;
export const DEFAULT_FORMAT: CoordinateFormat = LV95Format;

const state = (): PositionStoreState => ({
  displayFormat: DEFAULT_FORMAT,
  // // some unit tests fail because DEFAULT_PROJECTION is somehow not yet defined when they are run
  // // hence the `?.` operator
  zoom: DEFAULT_PROJECTION.getDefaultZoom(),
  rotation: 0,
  autoRotation: false,
  // hasOrientation: false,
  // // some unit tests fail because DEFAULT_PROJECTION is somehow not yet defined when they are run
  // // hence the `?.` operator
  center: DEFAULT_PROJECTION.bounds.center,
  projection: DEFAULT_PROJECTION,
  // crossHair: undefined,
  // crossHairPosition: undefined,
  // camera: undefined,
});

import resolution from "@/stores/position/getters/resolution";

import $reset from "./actions/$reset";

const getters: PositionStoreGetters = {
  centerEpsg4326,
  resolution,
  // extent,
  // isExtentOnlyWithinLV95Bounds,
};

const actions = {
  setDisplayedFormat,
  setZoom,
  increaseZoom,
  decreaseZoom,
  // zoomToExtent,
  setRotation,
  setAutoRotation,
  // setHasOrientation,
  setCenter,
  // setCrossHair,
  // setCameraPosition,
  // setProjection,
  $reset,
};

const usePositionStore: StoreDefinition<
  "position",
  PositionStoreState,
  {
    centerEpsg4326(): SingleCoordinate;
    resolution(): number;
  },
  {
    setDisplayedFormat: typeof setDisplayedFormat;
    setZoom: typeof setZoom;
    increaseZoom: typeof increaseZoom;
    decreaseZoom: typeof decreaseZoom;
    // zoomToExtent,
    setRotation: typeof setRotation;
    setAutoRotation: typeof setAutoRotation;
    // setHasOrientation,
    setCenter: typeof setCenter;
    // setCrossHair,
    // setCameraPosition,
    // setProjection,
    $reset: typeof $reset;
  }
> = defineStore("position", {
  state,
  getters: { ...getters },
  actions,
});

export default usePositionStore;

export type PositionStore = ReturnType<typeof usePositionStore>;
