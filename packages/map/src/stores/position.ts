import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";
import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { LV95, SwissCoordinateSystem, WGS84 } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { isNumber } from "@swissgeo/numbers";
import { defineStore } from "pinia";
import proj4 from "proj4";
import { computed, ref } from "vue";

import type { CoordinateFormat } from "@/utils/coordinates/coordinateFormat";

import { LV95Format } from "@/utils/coordinates/coordinateFormat";
import { normalizeAngle } from "@/utils/normalizeAngle";

export const DEFAULT_PROJECTION: CoordinateSystem = LV95;
export const DEFAULT_FORMAT = LV95Format;

const usePositionStore = defineStore("position", () => {
  const displayFormat = ref<CoordinateFormat>(DEFAULT_FORMAT);
  const zoom = ref(DEFAULT_PROJECTION.getDefaultZoom());
  const rotation = ref(0);
  const autoRotation = ref(false);
  const center = ref<SingleCoordinate>(DEFAULT_PROJECTION.bounds.center);
  const projection = ref<CoordinateSystem>(DEFAULT_PROJECTION);

  const centerEpsg4326 = computed<SingleCoordinate>(() => {
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
    projection.value.getResolutionForZoom(zoom.value, center.value),
  );

  function setDisplayedFormat(
    newFormat: CoordinateFormat,
    dispatcher: ActionDispatcher,
  ): void {
    displayFormat.value = newFormat;
  }

  function setZoom(newZoom: number, dispatcher: ActionDispatcher): void {
    if (!isNumber(newZoom) || newZoom < 0) {
      log.error({
        title: "Position store / setZoom",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Invalid zoom level", newZoom, dispatcher],
      });
      return;
    }
    zoom.value = projection.value.roundZoomLevel(newZoom);
  }

  function increaseZoom(dispatcher: ActionDispatcher): void {
    const rounded =
      projection.value instanceof SwissCoordinateSystem
        ? projection.value.roundZoomLevel(zoom.value, true)
        : projection.value.roundZoomLevel(zoom.value);
    setZoom(rounded + 1, dispatcher);
  }

  function decreaseZoom(dispatcher: ActionDispatcher): void {
    const rounded =
      projection.value instanceof SwissCoordinateSystem
        ? projection.value.roundZoomLevel(zoom.value, true)
        : projection.value.roundZoomLevel(zoom.value);
    setZoom(rounded - 1, dispatcher);
  }

  function setRotation(
    newRotation: number,
    dispatcher: ActionDispatcher,
  ): void {
    if (!isNumber(newRotation)) {
      log.error({
        title: "Position store / setRotation",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Invalid rotation", newRotation, dispatcher],
      });
      return;
    }
    rotation.value = normalizeAngle(newRotation);
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
  ): void {
    if (!newCenter || (Array.isArray(newCenter) && newCenter.length !== 2)) {
      log.error({
        title: "Position store / setCenter",
        titleColor: LogPreDefinedColor.Red,
        messages: ["Invalid center, ignoring", newCenter, dispatcher],
      });
      return;
    }

    if (projection.value.isInBounds(newCenter)) {
      center.value = newCenter;
    } else {
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
    }
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
    decreaseZoom,
    setRotation,
    setAutoRotation,
    setCenter,
    $reset,
  };
});

export default usePositionStore;

export type PositionStore = ReturnType<typeof usePositionStore>;
