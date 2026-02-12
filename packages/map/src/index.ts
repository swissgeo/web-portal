// make the ambient types known to esbuild
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as Types from '@swissgeo/shared/ambient'

import '../env.d.ts' // for reproject

import * as PROJECTION_EPSG from '@/composables/types.d'
import MapModule from '@/MapModule.vue'
import usePositionStore from '@/stores/position'
import TimeSlider from '@/tools/timeslider'

export { MapModule, usePositionStore, PROJECTION_EPSG, TimeSlider }
