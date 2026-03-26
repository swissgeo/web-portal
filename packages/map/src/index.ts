// make the ambient types known to esbuild

//import * as Types from '@swissgeo/shared/ambient'

import '../env.d.ts' // for reproject

import MapModule from '@/MapModule.vue'
import usePositionStore from '@/stores/position'

export type { MapLayerRenderer, Layer, LayerFormat } from '@/types'
import type { ActionDispatcher } from './stores/types'

import * as PROJECTION_EPSG from './composables/types.d'

export { MapModule, usePositionStore, PROJECTION_EPSG }
export type { ActionDispatcher }
