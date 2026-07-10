import type {
  FileLayerType,
  LayerType,
  Layer as SourceLayer,
} from "@swissgeo/layers";
import type {
  GeoJSONLayer,
  LayerFormat,
  Layer as MapLayer,
} from "@swissgeo/map";

const fileLayerFormatByType = {
  geojson: "GeoJSON",
  gpx: "GPX",
  kml: "KML",
  kmz: "KMZ",
} satisfies Record<FileLayerType, LayerFormat>;

/**
 * Get the corresponding LayerFormat for a given LayerType.
 * Throws an error if the layer type is "dataset" since dataset layers cannot be converted to file layers.
 */
function getFileLayerFormat(layerType: LayerType): LayerFormat {
  if (layerType === "dataset") {
    throw new Error("Dataset layers cannot be converted as file layers");
  }

  return fileLayerFormatByType[layerType];
}

/**
 * Verifies the geojson dataset contains the origin geojson string data
 */
function parseGeoJsonData(
  fileData: SourceLayer["data"],
): GeoJSONLayer["geoJsonData"] {
  if (typeof fileData !== "string") {
    throw new Error("GeoJSON file layer is missing file data");
  }

  try {
    return JSON.parse(fileData) as GeoJSONLayer["geoJsonData"];
  } catch {
    throw new Error("GeoJSON file layer data is not valid JSON");
  }
}

/**
 * Converts a FileLayer into a MapLayer, including geojson conversion when necessary
 */
export function convertFileLayerToMapLayer(layer: SourceLayer): MapLayer {
  const baseLayer = {
    ...layer,
    format: getFileLayerFormat(layer.type),
    layerId: layer.humanId,
    displayName: layer.info?.displayName ?? layer.humanId,
    opacity: 1,
    isVisible: true,
  };

  if (layer.type === "geojson") {
    return {
      ...baseLayer,
      geoJsonData: parseGeoJsonData(layer.data),
    } as GeoJSONLayer;
  }

  return baseLayer;
}
