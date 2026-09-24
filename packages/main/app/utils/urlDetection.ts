import type { LayerType } from "@swissgeo/layers";

type FileUrlExtension =
  | "gpx"
  | "kml"
  | "kmz"
  | "geojson"
  | "json"
  | "tif"
  | "tiff";

const FILE_URL_EXTENSIONS: Record<FileUrlExtension, LayerType> = {
  gpx: "gpx",
  kml: "kml",
  kmz: "kmz",
  geojson: "geojson",
  json: "geojson",
  tif: "cog",
  tiff: "cog",
};

/**
 * Supported file URL extensions for display in UI.
 */
export const SUPPORTED_URL_EXTENSIONS = Object.keys(
  FILE_URL_EXTENSIONS,
) as FileUrlExtension[];

/**
 * Extract file extension from a URL path. Returns null if not recognized.
 */
export function getUrlExtension(url: string): FileUrlExtension | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const ext = pathname.split(".").pop();
    if (ext && ext in FILE_URL_EXTENSIONS) {
      return ext as FileUrlExtension;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Get the LayerType for a given URL extension.
 */
export function getLayerTypeForExtension(ext: FileUrlExtension): LayerType {
  return FILE_URL_EXTENSIONS[ext];
}
