import type { LayerType } from "@swissgeo/layers";

import { useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { parseGeoJson } from "~/utils/geoJson";

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
    let fileData: string | Uint8Array | undefined;

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
