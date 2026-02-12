import { SwissCoordinateSystem } from '@swissgeo/coordinates'

import type { PositionStore } from '@/stores/position/types/position'
import type { ActionDispatcher } from '@/stores/types'

export default function increaseZoom(this: PositionStore, dispatcher: ActionDispatcher): void {
    if (this.projection instanceof SwissCoordinateSystem) {
        // for Swiss coordinate system, there's an extra param to trigger normalization
        // (snapping to the closest rounded value)
        this.zoom = this.projection.roundZoomLevel(this.zoom, true) + 1
    } else {
        this.zoom = this.projection.roundZoomLevel(this.zoom) + 1
    }
}
