import type { ActionDispatcher } from '@/store/types'
import type { PositionStore } from '@/stores/position/types/position'

export default function setHasOrientation(
    this: PositionStore,
    hasOrientation: boolean,
    dispatcher: ActionDispatcher
): void {
    this.hasOrientation = hasOrientation
}
