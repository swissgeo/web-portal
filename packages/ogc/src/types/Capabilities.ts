/**
 * Expose some common types so that consumers don't need to depend on the
 * parsing libraries (OpenLayers / ogc-client) directly.
 */

import type { WmtsLayer } from "@camptocamp/ogc-client";

/**
 * A legend as it is advertised by a service, normalised over the WMS and WMTS
 * capability shapes. Only WMS advertises the format and the size; WMTS gives a
 * bare URL.
 */
export interface Legend {
  href: string;
  format?: string;
  width?: number;
  height?: number;
}

export interface WMSCapabilityDimension {
  name: string;
  units: string;
  unitSymbol?: string;
  default?: string;
  multipleValues?: boolean;
  values?: string; // This usually contains the time string "2023-01-01/2023-12-31/P1D"
}

// WMTS layer dimensions are parsed by ogc-client, which doesn't export the
// dimension type by name, so we derive it. Fields are
// `identifier` / `defaultValue` / `values`.
export type WMTSCapabilityDimension = NonNullable<
  WmtsLayer["dimensions"]
>[number];
