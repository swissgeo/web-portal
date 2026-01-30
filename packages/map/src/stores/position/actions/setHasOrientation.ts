import type { PositionStore } from '@/stores/position/types/position'
import type { ActionDispatcher } from '@/stores/types'

export default function setHasOrientation(
    this: PositionStore,
    hasOrientation: boolean,
    dispatcher: ActionDispatcher
): void {
    this.hasOrientation = hasOrientation
}
