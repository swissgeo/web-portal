import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { isNumber } from "@swissgeo/numbers";

import type { PositionStore } from "@/stores/position";

import { normalizeAngle } from "@/stores/position/utils/normalizeAngle";

export default function setRotation(
  this: PositionStore,
  rotation: number,
  dispatcher: ActionDispatcher,
): void {
  if (!isNumber(rotation)) {
    log.error({
      title: "Position store / setRotation",
      titleColor: LogPreDefinedColor.Red,
      messages: ["Invalid rotation", rotation, dispatcher],
    });
    return;
  }
  this.rotation = normalizeAngle(rotation);
}
