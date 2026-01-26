import type { NormalizedExtent, SingleCoordinate } from '@swissgeo/coordinates'

import type { PositionStore } from '@/stores/position/types/position'

import useUIStore from '@/stores/ui'

export default function extent(this: PositionStore): NormalizedExtent {
    const uiStore = useUIStore()
    const halfScreenInMeter = {
        width: (uiStore.width / 2) * this.resolution,
        height: (uiStore.height / 2) * this.resolution,
    }
    // calculating extent with resolution
    const bottomLeft: SingleCoordinate = [
        this.projection.roundCoordinateValue(this.center[0] - halfScreenInMeter.width),
        this.projection.roundCoordinateValue(this.center[1] - halfScreenInMeter.height),
    ]
    const topRight: SingleCoordinate = [
        this.projection.roundCoordinateValue(this.center[0] + halfScreenInMeter.width),
        this.projection.roundCoordinateValue(this.center[1] + halfScreenInMeter.height),
    ]
    return [bottomLeft, topRight]
}
