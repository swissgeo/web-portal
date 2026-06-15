import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import type { PositionStore } from "@/stores/position";
import type { CoordinateFormat } from "@/utils/coordinates/coordinateFormat";

export default function setDisplayedFormat(
  this: PositionStore,
  displayedFormat: CoordinateFormat,
  dispatcher: ActionDispatcher,
): void {
  this.displayFormat = displayedFormat;
}
