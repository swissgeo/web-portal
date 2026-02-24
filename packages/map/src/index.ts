// make the ambient types known to esbuild

//import * as Types from '@swissgeo/shared/ambient'

import '../env.d.ts' // for reproject

import * as PROJECTION_EPSG from '@/composables/types.d'
import MapModule from '@/MapModule.vue'
import usePositionStore from '@/stores/position'

export { MapModule, usePositionStore, PROJECTION_EPSG }
export type { MapLayerRenderer } from '@/types'
