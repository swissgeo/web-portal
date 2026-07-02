import type { SingleCoordinate } from "@swissgeo/coordinates";
import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import log, { LogPreDefinedColor } from "@swissgeo/log";

import type { PositionStore } from "@/stores/position";

export default function setCenter(
  this: PositionStore,
  center: SingleCoordinate,
  dispatcher: ActionDispatcher,
): void {
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
}
