import type { PositionStore } from '@/stores/position/types/position'

export default function resolution(this: PositionStore): number {
    return this.projection.getResolutionForZoomAndCenter(this.zoom, this.center)
}
