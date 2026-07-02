import type { CoordinateSystem, SingleCoordinate } from "@swissgeo/coordinates";
import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { LV95, SwissCoordinateSystem, WGS84 } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { isNumber } from "@swissgeo/numbers";
import { defineStore } from "pinia";
import proj4 from "proj4";

import type { CoordinateFormat } from "@/utils/coordinates/coordinateFormat";

import { LV95Format } from "@/utils/coordinates/coordinateFormat";
import { normalizeAngle } from "@/utils/normalizeAngle";

export const DEFAULT_PROJECTION: CoordinateSystem = LV95;
export const DEFAULT_FORMAT = LV95Format;

const state = () => ({
  displayFormat: DEFAULT_FORMAT,
  zoom: DEFAULT_PROJECTION.getDefaultZoom(),
  rotation: 0,
  autoRotation: false,
  center: DEFAULT_PROJECTION.bounds.center,
  projection: DEFAULT_PROJECTION,
});

const usePositionStore = defineStore("position", {
  state,
  getters: {
    centerEpsg4326(): SingleCoordinate {
      const centerEpsg4326Unrounded = proj4(
        this.projection.epsg,
        WGS84.epsg,
        this.center,
      );
      return [
        WGS84.roundCoordinateValue(centerEpsg4326Unrounded[0]),
        WGS84.roundCoordinateValue(centerEpsg4326Unrounded[1]),
      ];
    },
    resolution(): number {
      return this.projection.getResolutionForZoom(this.zoom, this.center);
    },
  },
  actions: {
    setDisplayedFormat(
      displayedFormat: CoordinateFormat,
      dispatcher: ActionDispatcher,
    ): void {
      this.displayFormat = displayedFormat;
    },

    setZoom(zoom: number, dispatcher: ActionDispatcher): void {
      if (!isNumber(zoom) || zoom < 0) {
        log.error({
          title: "Position store / setZoom",
          titleColor: LogPreDefinedColor.Red,
          messages: ["Invalid zoom level", zoom, dispatcher],
        });
        return;
      }
      this.zoom = this.projection.roundZoomLevel(zoom);
    },

    increaseZoom(dispatcher: ActionDispatcher): void {
      if (this.projection instanceof SwissCoordinateSystem) {
        this.zoom = this.projection.roundZoomLevel(this.zoom, true) + 1;
      } else {
        this.zoom = this.projection.roundZoomLevel(this.zoom) + 1;
      }
    },

    decreaseZoom(dispatcher: ActionDispatcher): void {
      if (this.projection instanceof SwissCoordinateSystem) {
        this.zoom = this.projection.roundZoomLevel(this.zoom, true) - 1;
      } else {
        this.zoom = this.projection.roundZoomLevel(this.zoom) - 1;
      }
    },

    setRotation(rotation: number, dispatcher: ActionDispatcher): void {
      if (!isNumber(rotation)) {
        log.error({
          title: "Position store / setRotation",
          titleColor: LogPreDefinedColor.Red,
          messages: ["Invalid rotation", rotation, dispatcher],
        });
        return;
      }
      this.rotation = normalizeAngle(rotation);
    },

    setAutoRotation(autoRotation: boolean, dispatcher: ActionDispatcher): void {
      this.autoRotation = autoRotation;
    },

    setCenter(center: SingleCoordinate, dispatcher: ActionDispatcher): void {
      if (!center || (Array.isArray(center) && center.length !== 2)) {
        log.error({
          title: "Position store / setCenter",
          titleColor: LogPreDefinedColor.Red,
          messages: ["Invalid center, ignoring", center, dispatcher],
        });
        return;
      }

      if (this.projection.isInBounds(center)) {
        this.center = center;
      } else {
        log.warn({
          title: "Position store / setCenter",
          titleColor: LogPreDefinedColor.Red,
          messages: [
            "Center received is out of projection bounds, ignoring",
            this.projection,
            center,
            dispatcher,
          ],
        });
      }
    },

    $reset(dispatcher: ActionDispatcher): void {
      this.setCenter(DEFAULT_PROJECTION.bounds.center, dispatcher);
      this.setZoom(DEFAULT_PROJECTION.getDefaultZoom(), dispatcher);
      this.setRotation(0, dispatcher);
      this.setDisplayedFormat(DEFAULT_FORMAT, dispatcher);
    },
  },
});

export default usePositionStore;

export type PositionStore = ReturnType<typeof usePositionStore>;
