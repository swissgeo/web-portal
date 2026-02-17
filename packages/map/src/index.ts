// make the ambient types known to esbuild

//import * as Types from '@swissgeo/shared/ambient'

import '../env.d.ts' // for reproject

import MapModule from '@/MapModule.vue'
import usePositionStore from '@/stores/position'
import TimeSlider from '@/tools/timeslider'

export { MapModule, usePositionStore, TimeSlider }
