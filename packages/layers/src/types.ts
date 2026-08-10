import type { Dataset } from "@swissgeo/ogc";

export type FileLayerType = "geojson" | "kml" | "kmz" | "gpx";
export type LayerType = "dataset" | FileLayerType;

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

export interface Layer {
  type: LayerType;
  uuid: string;
  humanId: string; // something human readable. usually the layer ID. Not unique!
  isLoading: boolean;
  info?: LayerInfo;
  // data is either the dataset or the file data, depending on whether
  // this is used a file layer or dataset layer. In the case of kmz (gzip folder), the data is binary, hence also allowing Uint8Array.
  data?: Dataset | string | Uint8Array;
  // Url to the dataset or the file
  layerUrl?: string;
}

// Type to narrow above type
export interface DatasetLayer extends Layer {
  type: "dataset";
  data: Dataset;
}

export * from "./utils";
