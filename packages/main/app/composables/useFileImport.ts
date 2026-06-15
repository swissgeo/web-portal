import type { LayerType } from "@swissgeo/layers";

import { useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";

/**
 * Composable for importing local files as layers
 */
export function useFileImport() {
  const layerStore = useLayerStore();

  /**
   * Import a file and add it to the layer store
   */
  async function importFile(file: File): Promise<void> {
    log.debug(`Importing file: ${file.name}`);

    const filename = file.name.toLowerCase();
    let layerType: LayerType;
    let fileData: string | undefined;

    // Determine layer type based on file extension
    if (filename.endsWith(".kmz")) {
      layerType = "kmz";
      // Store raw file data for KMZ
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // Convert to base64 for storage
      fileData = btoa(String.fromCharCode(...uint8Array));
    } else if (filename.endsWith(".kml")) {
      layerType = "kml";
      fileData = await file.text();
    } else if (filename.endsWith(".gpx")) {
      layerType = "gpx";
      fileData = await file.text();
    } else if (filename.endsWith(".geojson") || filename.endsWith(".json")) {
      layerType = "geojson";
      fileData = await file.text();
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
      // Store the raw file data for KML/KMZ/GPX
      data: fileData,
    };
    layerStore.addLayer(layer);
    log.info(`Successfully imported file: ${file.name}`);
  }

  return {
    importFile,
  };
}
