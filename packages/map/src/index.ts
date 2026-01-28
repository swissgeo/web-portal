// make the ambient types known to esbuild
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as Types from '@swissgeo/shared/ambient'

import '../env.d.ts' // for reproject

import useOlDrawing from '@/composables/olDrawing.composable'
import MapModule from '@/MapModule.vue'
import useDrawingStore, { DrawingMode } from '@/stores/drawing'
import * as markerIcons from '@/utils/markerIcons'

export { MapModule, useOlDrawing, useDrawingStore, DrawingMode, markerIcons }
