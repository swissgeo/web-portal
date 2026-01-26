import type { PositionStore } from '@/stores/position/types/position'
import type { ActionDispatcher } from '@/stores/types'
import type { CoordinateFormat } from '@/utils/coordinates/coordinateFormat'

export default function setDisplayedFormat(
    this: PositionStore,
    displayedFormat: CoordinateFormat,
    dispatcher: ActionDispatcher
): void {
    this.displayFormat = displayedFormat
}
