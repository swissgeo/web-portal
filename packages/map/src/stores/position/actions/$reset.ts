import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'

import type { PositionStore } from '@/stores/position/types/position'

import { DEFAULT_PROJECTION, DEFAULT_FORMAT } from '..'

export default function $reset(this: PositionStore, dispatcher: ActionDispatcher) {
    this.setCenter(DEFAULT_PROJECTION.bounds!.center, dispatcher)
    this.setZoom(DEFAULT_PROJECTION.getDefaultZoom(), dispatcher)
    this.setRotation(0, dispatcher)
    this.setDisplayedFormat(DEFAULT_FORMAT, dispatcher)
}
