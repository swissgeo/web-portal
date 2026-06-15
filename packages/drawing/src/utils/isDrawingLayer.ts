import { DRAWING_LAYER_ID } from "@swissgeo/shared";

type LayerLike = {
  humanId?: unknown;
  layerId?: unknown;
  type?: unknown;
};

export function isDrawingLayer(layer: LayerLike): boolean {
  const layerIdentifier =
    typeof layer.humanId === "string"
      ? layer.humanId
      : typeof layer.layerId === "string"
        ? layer.layerId
        : null;

  const layerType =
    typeof layer.type === "string" ? layer.type.toLowerCase() : null;

  return layerIdentifier === DRAWING_LAYER_ID && layerType === "kml";
}
