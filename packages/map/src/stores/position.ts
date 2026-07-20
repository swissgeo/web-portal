import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";
import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import {
  LV95,
  SwissCoordinateSystem,
  WGS84,
  constants,
} from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { isNumber } from "@swissgeo/numbers";
import { defineStore } from "pinia";
import proj4 from "proj4";
import { computed, ref } from "vue";

import type { CoordinateFormat } from "@/utils/coordinates/coordinateFormat";

import { useMapStore } from "@/stores/map";
import { LV95Format } from "@/utils/coordinates/coordinateFormat";
import { normalizeAngle } from "@/utils/normalizeAngle";

import { useOlMapPosition } from "../composables/useOlMapPosition";

export const DEFAULT_PROJECTION: CoordinateSystem = LV95;
export const DEFAULT_FORMAT = LV95Format;

const MIN_ZOOM = constants.SWISSTOPO_MIN_ZOOM_LEVEL;
const MAX_ZOOM = constants.SWISSTOPO_MAX_ZOOM_LEVEL;

const usePositionStore = defineStore("position", () => {
  const mapStore = useMapStore();

  const displayFormat = ref<CoordinateFormat>(DEFAULT_FORMAT);
  const autoRotation = ref(false);
  const projection = ref<CoordinateSystem>(DEFAULT_PROJECTION);

  const { zoom, rotation, center } = useOlMapPosition(autoRotation, projection);

  const centerEpsg4326 = computed<SingleCoordinate | undefined>(() => {
    if (!center.value) {
      return undefined;
    }
    const centerEpsg4326Unrounded = proj4(
      projection.value.epsg,
      WGS84.epsg,
      center.value,
    );
    return [
      WGS84.roundCoordinateValue(centerEpsg4326Unrounded[0]),
      WGS84.roundCoordinateValue(centerEpsg4326Unrounded[1]),
    ];
  });

  const resolution = computed(() =>
    zoom.value === undefined || !center.value
      ? undefined
      : projection.value.getResolutionForZoom(zoom.value, center.value),
  );

  function setDisplayedFormat(
    newFormat: CoordinateFormat,
    dispatcher: ActionDispatcher,
  ): void {
    displayFormat.value = newFormat;
  }

  function setZoom(newZoom: number, dispatcher: ActionDispatcher): boolean {
    if (!isNumber(newZoom) || newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) {
      log.error({
        title: "Position store / setZoom",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Invalid zoom level", newZoom, dispatcher],
      });
      return false;
    }
    const view = mapStore.olMap?.getView();
    if (!view) {
      log.error({
        title: "Position store / setZoom",
        titleColor: LogPreDefinedColor.Red,
        messages: ["No view available", dispatcher],
      });
      return false;
    }
    view.animate({
      zoom: projection.value.roundZoomLevel(newZoom),
      duration: 200,
    });
    return true;
  }

  function increaseZoom(dispatcher: ActionDispatcher): void {
    if (zoom.value === undefined) {
      return;
    }

    // ignoring next because it seems to be a type guard rather than actual
    // code. Since this is handling a case for other projection systems and we
    // currently only support SwissCoordinateSystem, we can safely ignore this.
    // istanbul ignore next
    const rounded =
      projection.value instanceof SwissCoordinateSystem
        ? projection.value.roundZoomLevel(zoom.value, true)
        : projection.value.roundZoomLevel(zoom.value);

    setZoom(Math.min(rounded + 1, MAX_ZOOM), dispatcher);
  }

  function decreaseZoom(dispatcher: ActionDispatcher): void {
    if (zoom.value === undefined) {
      return;
    }

    // ignoring next because it seems to be a type guard rather than actual
    // code. Since this is handling a case for other projection systems and we
    // currently only support SwissCoordinateSystem, we can safely ignore this.
    // istanbul ignore next
    const rounded =
      projection.value instanceof SwissCoordinateSystem
        ? projection.value.roundZoomLevel(zoom.value, true)
        : projection.value.roundZoomLevel(zoom.value);

    setZoom(Math.max(rounded - 1, MIN_ZOOM), dispatcher);
  }

  function canIncreaseZoom(): boolean {
    return zoom.value !== undefined && zoom.value < MAX_ZOOM;
  }

  function canDecreaseZoom(): boolean {
    return zoom.value !== undefined && zoom.value > MIN_ZOOM;
  }

  function setRotation(
    newRotation: number,
    dispatcher: ActionDispatcher,
  ): boolean {
    if (!isNumber(newRotation)) {
      log.error({
        title: "Position store / setRotation",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Invalid rotation", newRotation, dispatcher],
      });
      return false;
    }

    const view = mapStore.olMap?.getView();

    if (!view) {
      log.error({
        title: "Position store / setRotation",
        titleColor: LogPreDefinedColor.Red,
        messages: ["No view available", dispatcher],
      });
      return false;
    }

    view.animate({ rotation: normalizeAngle(newRotation), duration: 200 });
    return true;
  }

  function setAutoRotation(
    newAutoRotation: boolean,
    dispatcher: ActionDispatcher,
  ): void {
    autoRotation.value = newAutoRotation;
  }

  function setCenter(
    newCenter: SingleCoordinate,
    dispatcher: ActionDispatcher,
  ): boolean {
    if (!newCenter || (Array.isArray(newCenter) && newCenter.length !== 2)) {
      log.error({
        title: "Position store / setCenter",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Invalid center, ignoring", newCenter, dispatcher],
      });
      return false;
    }

    if (!projection.value.isInBounds(newCenter)) {
      log.warn({
        title: "Position store / setCenter",
        titleColor: LogPreDefinedColor.Red,
        messages: [
          "Center received is out of projection bounds, ignoring",
          projection.value,
          newCenter,
          dispatcher,
        ],
      });
      return false;
    }

    const view = mapStore.olMap?.getView();

    if (!view) {
      log.error({
        title: "Position store / setCenter",
        titleColor: LogPreDefinedColor.Red,
        messages: ["No view available", dispatcher],
      });
      return false;
    }

    view.animate({ center: [...newCenter], duration: 200 });
    return true;
  }

  function $reset(dispatcher: ActionDispatcher): void {
    setCenter(DEFAULT_PROJECTION.bounds.center, dispatcher);
    setZoom(DEFAULT_PROJECTION.getDefaultZoom(), dispatcher);
    setRotation(0, dispatcher);
    setDisplayedFormat(DEFAULT_FORMAT, dispatcher);
  }

  return {
    displayFormat,
    zoom,
    rotation,
    autoRotation,
    center,
    projection,
    centerEpsg4326,
    resolution,
    setDisplayedFormat,
    setZoom,
    increaseZoom,
    canIncreaseZoom,
    decreaseZoom,
    canDecreaseZoom,
    setRotation,
    setAutoRotation,
    setCenter,
    $reset,
  };
});

export default usePositionStore;

export type PositionStore = ReturnType<typeof usePositionStore>;
