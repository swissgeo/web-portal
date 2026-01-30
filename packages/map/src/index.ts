// make the ambient types known to esbuild
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as Types from '@swissgeo/shared/ambient'

import '../env.d.ts' // for reproject

import * as PROJECTION_EPSG from '@/composables/types.d'
import MapModule from '@/MapModule.vue'

export { MapModule, PROJECTION_EPSG }

// Re-export drawing functionality from @swissgeo/drawing
// export {
//     useDrawingStore,
//     DrawingMode,
//     useOlDrawing,
//     OpenLayersDrawingLayer,
//     DrawingPanel,
//     useDrawingManager,
//     EPSG_4326_WGS84,
//     EPSG_2056_CH1903,
// } from '@swissgeo/drawing'
// export type { MarkerIcon } from '@swissgeo/drawing'
// export * as markerIcons from '@swissgeo/drawing'
