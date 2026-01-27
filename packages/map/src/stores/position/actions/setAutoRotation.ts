import type { PositionStore } from '@/stores/position/types/position'
import type { ActionDispatcher } from '@/stores/types'

export default function setAutoRotation(
    this: PositionStore,
    autoRotation: boolean,
    dispatcher: ActionDispatcher
): void {
    this.autoRotation = autoRotation
}
