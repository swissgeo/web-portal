import "./stylesheet.css";
import useAddLayerToMap from "./composables/useAddLayerToMap.composable";
import MapModule from "./MapModule.vue";
import usePositionStore from "./stores/position";

export * from "./stores/map";
export * from "./composables/useMap.composable";
// importing as "type" doesn't work with the DTS bundler somehow
// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export * from "@/types/layers";

import * as PROJECTION_EPSG from "./composables/types.d";

export {
  default as coordinateFormat,
  LV95Format,
  LV03Format,
  WGS84Format,
  UTMFormat,
  MGRSFormat,
} from "./utils/coordinates/coordinateFormat";
export type { CoordinateFormat } from "./utils/coordinates/coordinateFormat";
export { geoadminToMapLibreStyle } from "./utils/geoadminToMapLibreStyle";
export type {
  MapLibreStyle,
  MapLibreLayer,
  GeoadminToMapLibreResult,
  GeoadminToMapLibreOptions,
} from "./utils/geoadminToMapLibreStyle";
export { createShapeIcon, makeGetImage } from "./utils/maplibreShapeIcons";
export type { ShapeIconSpec, ShapeIconType } from "./utils/maplibreShapeIcons";
export { MapModule, usePositionStore, useAddLayerToMap, PROJECTION_EPSG };
