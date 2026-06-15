import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import type { PositionStore } from "@/stores/position";

export default function setAutoRotation(
  this: PositionStore,
  autoRotation: boolean,
  dispatcher: ActionDispatcher,
): void {
  this.autoRotation = autoRotation;
}
