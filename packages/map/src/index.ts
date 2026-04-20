import '../env.d.ts' // for reproject

import MapModule from '@/MapModule.vue'
import usePositionStore from '@/stores/position'

// importing as "type" doesn't work with the DTS bundler somehow
// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export * from '@/types/layers'
import type { ActionDispatcher } from './stores/types'

import * as PROJECTION_EPSG from './composables/types.d'

export {
    default as coordinateFormat,
    LV95Format,
    LV03Format,
    WGS84Format,
    UTMFormat,
    MGRSFormat,
} from './utils/coordinates/coordinateFormat'
export type { CoordinateFormat } from './utils/coordinates/coordinateFormat'
export { MapModule, usePositionStore, PROJECTION_EPSG }
export type { ActionDispatcher }
