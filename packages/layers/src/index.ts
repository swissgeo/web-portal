import { Feature as OGCFeature } from "@swissgeo/shared/ogc";
import { v4 as uuidv4 } from "uuid";

export enum LayerType {
  WMTS = "wmts",
}

export interface Layer {
  uuid: string;
  record: OGCFeature;
  isVisible: boolean;
  type: LayerType;
  opacity: number;
}

export const makeLayer = (
  record: OGCFeature,
  type: LayerType,
  options: Partial<Layer>,
): Layer => {
  return {
    uuid: uuidv4(),
    record,
    opacity: 1,
    isVisible: true,
    type,
    ...options,
  };
};

export { useLayerStore } from "@/stores/layer";
