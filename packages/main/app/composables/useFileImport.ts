import type { LayerType } from "@swissgeo/layers";

import { useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { parseGeoJson } from "~/utils/geoJson";
import { useI18n } from "vue-i18n";

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
 * Extract file extension from a URL path. Returns null if not recognized.
 */
function getUrlExtension(url: string): FileUrlExtension | null {
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
 * Composable for importing local files and remote file URLs as layers
 */
export function useFileImport() {
  const layerStore = useLayerStore();
  const { t } = useI18n();
  const runtimeConfig = useRuntimeConfig();
  const maxSizeMB = runtimeConfig.public.maxFileSizeMB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  /**
   * Import a local file and add it to the layer store
   */
  async function importFile(file: File): Promise<void> {
    if (file.size > maxSizeBytes) {
      throw new Error(
        t("toolbox.import.errorMessages.fileTooLarge", {
          fileName: file.name,
          maxSize: maxSizeMB,
        }),
      );
    }

    log.debug(`Importing file: ${file.name}`);

    const filename = file.name.toLowerCase();
    let layerType: LayerType;
    let fileData: string | Uint8Array | File | undefined;

    // Determine layer type based on file extension
    if (filename.endsWith(".kmz")) {
      layerType = "kmz";
      // Store raw file data for KMZ
      const arrayBuffer = await file.arrayBuffer();
      fileData = new Uint8Array(arrayBuffer);
    } else if (filename.endsWith(".kml")) {
      layerType = "kml";
      fileData = await file.text();
    } else if (filename.endsWith(".gpx")) {
      layerType = "gpx";
      fileData = await file.text();
    } else if (filename.endsWith(".geojson") || filename.endsWith(".json")) {
      layerType = "geojson";
      fileData = await file.text();
      // Fail here rather than let the map renderer silently drop data that is
      // unparseable, or parseable JSON that isn't a GeoJSON FeatureCollection.
      if (!parseGeoJson(fileData)) {
        throw new Error(`Invalid GeoJSON file: ${file.name}`);
      }
    } else if (filename.endsWith(".tif") || filename.endsWith(".tiff")) {
      layerType = "cog";
      // Store the File object directly for OpenLayers GeoTIFF source
      fileData = file;
    } else {
      throw new Error(`Unsupported file type: ${filename}`);
    }

    // Create and add the layer
    const layer = {
      uuid: crypto.randomUUID(),
      humanId: file.name,
      opacity: 1,
      isVisible: true,
      type: layerType,
      isLoading: false,
      info: {
        displayName: file.name,
        abstract: `Imported from local file: ${file.name}`,
      },
      // Store the raw file data for KML/KMZ/GPX/COG
      data: fileData,
    };
    layerStore.addLayer(layer);
    log.info(`Successfully imported file: ${file.name}`);
  }

  /**
   * Import a file from a URL and add it to the layer store.
   * Detects file type from URL extension (.gpx, .kml, .kmz, .geojson, .json, .tif, .tiff).
   * For COG (.tif/.tiff), the URL is stored directly for OpenLayers to stream.
   * For other types, the file content is fetched and stored.
   */
  async function importFileUrl(url: string): Promise<void> {
    const ext = getUrlExtension(url);
    if (!ext) {
      throw new Error(t("toolbox.import.errorMessages.unsupportedUrlType"));
    }

    const layerType = FILE_URL_EXTENSIONS[ext];
    const displayName = url.split("/").pop() ?? url;

    log.debug(`Importing file from URL: ${url} (type: ${layerType})`);

    // For COG, store the URL directly — OpenLayers streams tiles on demand
    if (layerType === "cog") {
      const layer = {
        uuid: crypto.randomUUID(),
        humanId: url,
        opacity: 1,
        isVisible: true,
        type: layerType,
        isLoading: false,
        info: {
          displayName,
          abstract: `Imported from URL: ${url}`,
        },
        data: url,
      };
      layerStore.addLayer(layer);
      log.info(`Successfully imported COG from URL: ${url}`);
      return;
    }

    // For all other types, fetch the content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        t("toolbox.import.errorMessages.fetchFailed", {
          status: response.status,
        }),
      );
    }

    let fileData: string | Uint8Array;

    if (ext === "kmz") {
      const arrayBuffer = await response.arrayBuffer();
      fileData = new Uint8Array(arrayBuffer);
    } else {
      fileData = await response.text();
    }

    // Validate GeoJSON content
    if (
      layerType === "geojson" &&
      typeof fileData === "string" &&
      !parseGeoJson(fileData)
    ) {
      throw new Error(`Invalid GeoJSON content from: ${url}`);
    }

    const layer = {
      uuid: crypto.randomUUID(),
      humanId: url,
      opacity: 1,
      isVisible: true,
      type: layerType,
      isLoading: false,
      info: {
        displayName,
        abstract: `Imported from URL: ${url}`,
      },
      data: fileData,
    };
    layerStore.addLayer(layer);
    log.info(`Successfully imported ${layerType} from URL: ${url}`);
  }

  return {
    importFile,
    importFileUrl,
  };
}
