import type { SingleCoordinate } from '@swissgeo/coordinates'

import type { PositionStore } from '@/stores/position/types/position'
import type { ActionDispatcher } from '@/stores/types'

import { CrossHairs } from '@/stores/position/types/crossHairs.enum'

export default function setCrossHair(
    this: PositionStore,
    payload: {
        crossHair?: CrossHairs
        crossHairPosition?: SingleCoordinate
    },
    dispatcher: ActionDispatcher
): void {
    const { crossHair, crossHairPosition } = payload
    if (!crossHair) {
        this.crossHair = undefined
        this.crossHairPosition = undefined
    } else if (crossHair in CrossHairs) {
        this.crossHair = crossHair
        // if a position is defined as param we use it
        // if no position was given, we use the current center of the map as crosshair position
        this.crossHairPosition = crossHairPosition ?? this.center
    }
}
