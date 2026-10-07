import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

export const AVAILABLE_BACKGROUNDS = {
  swissimage: "ch.swisstopo.swissimage",
  colorMap: "ch.swisstopo.pixelkarte-farbe",
  greyMap: "ch.swisstopo.pixelkarte-grau",
};

export function getBackgroundTranslationKey(
  layer: Layer | null | undefined,
): string {
  if (layer === null || layer === undefined) {
    return "backgroundLayers.voidMap";
  }

  const layerData = layer.data as Dataset;

  if (layerData.id === AVAILABLE_BACKGROUNDS.greyMap) {
    return "backgroundLayers.greyMap";
  } else if (layerData.id === AVAILABLE_BACKGROUNDS.colorMap) {
    return "backgroundLayers.colorMap";
  } else if (layerData.id === AVAILABLE_BACKGROUNDS.swissimage) {
    return "backgroundLayers.swissimage";
  }

  return "backgroundLayers.voidMap";
}
