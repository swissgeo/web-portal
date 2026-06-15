/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  Dataset,
  GeoJSON,
  WMSCapabilities,
  WMTSCapabilities,
} from "@swissgeo/ogc";
import type { GeoAdminGeoJSONStyleDefinition } from "@swissgeo/shared/geojson";

export type LayerType = "wmts" | "wms" | "geojson" | "kml" | "kmz" | "gpx";

export interface LayerAttribution {
  title: string;
  url?: string;
  logoUrl?: string;
}

export interface LayerInfo {
  displayName: string;
  abstract?: string;
  attribution?: LayerAttribution;
}

export interface Dimension {
  currentValue: string | null;
  availableValues: string[];
}

export type DimensionId = "time";

export interface Layer {
  uuid: string;
  humanId: string;
  isVisible: boolean;
  type: LayerType;
  opacity: number;
  isLoading: boolean;
  info?: LayerInfo | null;
  dataset?: Dataset;
  dimensions?: Partial<Record<DimensionId, Dimension>>;
}

export interface DatasetLayer extends Layer {
  dataset: Dataset;
}

export interface FileLayer extends Layer {
  fileData?: string;
  geoJsonData?: GeoJSON;
}

export function useLayerStore(): any;
export function makeServerLayer(
  dataset: Dataset,
  options?: Partial<Layer>,
): Layer;
export function getLayerInfoFromWMSCapabilities(
  capabilities: WMSCapabilities,
  layerId: string,
): LayerInfo;
export function getLayerInfoFromWMTSCapabilities(
  capabilities: WMTSCapabilities,
  layerId: string,
): LayerInfo;

export type { GeoAdminGeoJSONStyleDefinition };
