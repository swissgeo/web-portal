import type { WmtsEndpoint } from "@camptocamp/ogc-client";
import type { Options as WMTSOptions } from "ol/source/WMTS";

/**
 * Options that steer how the OpenLayers WMTS source is assembled from a parsed
 * WMTS endpoint. All keys are optional; sensible defaults are derived from the
 * capabilities, mirroring OpenLayers' own `optionsFromCapabilities`.
 */
export interface BuildWmtsOptionsConfig {
  /** Matrix set identifier; defaults to the layer's first advertised set. */
  matrixSet?: string;
  /** Style identifier; defaults to the layer's default style. */
  style?: string;
  /** Image format (MIME type); defaults to the first advertised resource. */
  format?: string;
  /** Projection code; defaults to the matrix set CRS (URN simplified to EPSG:xxxx). */
  projection?: string;
  /** Dimension values to bake in; defaults to the layer's default dimensions. */
  dimensions?: Record<string, string>;
  /** crossOrigin passed through to the OL source; omitted by default. */
  crossOrigin?: string | null;
}

/**
 * Builds the OpenLayers WMTS source `Options` from an ogc-client `WmtsEndpoint`.
 *
 * This is the local equivalent of OpenLayers' `optionsFromCapabilities`, kept in
 * `map` (where OpenLayers is allowed) so that `@swissgeo/ogc` stays OL-free.
 * The signature intentionally mirrors the `getOpenLayersWmtsOptions` helper we
 * propose to contribute upstream, so a later swap to the published method is a
 * one-line body change (GPS-804 State 3).
 */
export async function buildWmtsOptions(
  endpoint: WmtsEndpoint,
  layerName: string,
  config: BuildWmtsOptionsConfig = {},
): Promise<WMTSOptions | null> {
  const layer = endpoint.getLayerByName(layerName);
  if (!layer) {
    return null;
  }

  const matrixSetLink =
    layer.matrixSets.find((set) => set.identifier === config.matrixSet) ??
    layer.matrixSets[0];
  if (!matrixSetLink) {
    return null;
  }

  // ogc-client builds the (hard) tile grid for us, loading `ol` lazily.
  const tileGrid = await endpoint.getOpenLayersTileGrid(
    layerName,
    matrixSetLink.identifier,
  );
  if (!tileGrid) {
    return null;
  }

  // Resource link carries the request URL (REST template or KVP base), the
  // encoding (REST|KVP) and the image format.
  const resourceLink = endpoint.getLayerResourceLink(layerName, config.format);
  if (!resourceLink) {
    return null;
  }

  const options: WMTSOptions = {
    urls: [resourceLink.url],
    layer: layerName,
    matrixSet: matrixSetLink.identifier,
    format: config.format ?? resourceLink.format,
    projection: config.projection ?? simplifyEpsgUrn(matrixSetLink.crs),
    requestEncoding: resourceLink.encoding,
    tileGrid,
    style: config.style ?? layer.defaultStyle,
    dimensions: config.dimensions ?? endpoint.getDefaultDimensions(layerName),
  };

  if (config.crossOrigin !== undefined) {
    options.crossOrigin = config.crossOrigin;
  }

  return options;
}

/**
 * Turns a full EPSG URN into the simple `EPSG:xxxx` code OpenLayers registers.
 * Handles the common forms `urn:ogc:def:crs:EPSG:2056`,
 * `urn:ogc:def:crs:EPSG::2056` and `urn:ogc:def:crs:EPSG:6.18:3:2056` (all ->
 * `EPSG:2056`). Non-EPSG URNs and already-simple codes are returned untouched.
 */
function simplifyEpsgUrn(crs: string): string {
  const match = crs.match(/^urn:ogc:def:crs:EPSG:.*?(\d+)$/i);
  return match ? `EPSG:${match[1]}` : crs;
}
