import type { ActionDispatcher } from '@/store/types'
import type { PositionStore } from '@/stores/position/types/position'

export default function setAutoRotation(
    this: PositionStore,
    autoRotation: boolean,
    dispatcher: ActionDispatcher
): void {
    this.autoRotation = autoRotation
}
