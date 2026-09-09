import type { LayerType } from "@swissgeo/layers";

import { useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { parseGeoJson } from "~/utils/geoJson";
import {
  getLayerTypeForExtension,
  getUrlExtension,
  SUPPORTED_URL_EXTENSIONS,
} from "~/utils/urlDetection";
import { useI18n } from "vue-i18n";

/**
 * Composable for importing local files and remote file URLs as layers
 */
export function useFileImport() {
  const layerStore = useLayerStore();
  const { t } = useI18n();
  const runtimeConfig = useRuntimeConfig();
  const maxSizeMB = runtimeConfig.public.maxFileSizeMB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  function addLayer(
    layerType: LayerType,
    humanId: string,
    displayName: string,
    abstract: string,
    data?: string | Uint8Array | File,
    sourceUrl?: string,
  ) {
    layerStore.addLayer({
      uuid: crypto.randomUUID(),
      humanId,
      type: layerType,
      isLoading: false,
      info: { displayName, abstract },
      data,
      sourceUrl,
    });
  }

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
      fileData = file;
    } else {
      throw new Error(`Unsupported file type: ${filename}`);
    }

    addLayer(
      layerType,
      file.name,
      file.name,
      `Imported from local file: ${file.name}`,
      fileData,
    );
    log.info(`Successfully imported file: ${file.name}`);
  }

  /**
   * Import a file from a URL and add it to the layer store.
   * Detects file type from URL extension (.gpx, .kml, .kmz, .geojson, .json, .tif, .tiff).
   * For COG (.tif/.tiff), the URL is stored as sourceUrl for OpenLayers to stream.
   * For other types, the file content is fetched and stored.
   */
  async function importFileUrl(url: string): Promise<void> {
    const ext = getUrlExtension(url);
    if (!ext) {
      throw new Error(
        t("toolbox.import.errorMessages.unsupportedUrlType", {
          types: SUPPORTED_URL_EXTENSIONS.join(", "),
        }),
      );
    }

    const layerType = getLayerTypeForExtension(ext);
    const displayName = url.split("/").pop() ?? url;

    log.debug(`Importing file from URL: ${url} (type: ${layerType})`);

    // For COG, store the URL as sourceUrl — OpenLayers streams tiles on demand
    if (layerType === "cog") {
      addLayer(
        layerType,
        url,
        displayName,
        `Imported from URL: ${url}`,
        undefined,
        url,
      );
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

    addLayer(
      layerType,
      url,
      displayName,
      `Imported from URL: ${url}`,
      fileData,
    );
    log.info(`Successfully imported ${layerType} from URL: ${url}`);
  }

  return {
    importFile,
    importFileUrl,
  };
}
