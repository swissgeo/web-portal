export type DrawingMode = "None" | "Point" | "LineString" | "Polygon" | "Text";

export interface MarkerIcon {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  anchor: [number, number];
}

export const MARKER_ICONS: MarkerIcon[];
export const DEFAULT_MARKER_ICON: MarkerIcon | undefined;
export const DRAWING_LAYER_ID: string;
export const EPSG_4326_WGS84: string;
export const EPSG_2056_CH1903: string;

// export function useOlDrawing(...args: any[]): any;
// export function useDrawingManager(): any;
// export function useDrawingStore(): any;
export function getMarkerIconById(iconId: string): MarkerIcon | undefined;
