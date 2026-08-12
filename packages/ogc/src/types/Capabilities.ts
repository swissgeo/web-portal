/**
 * Expose some common types so that consumers don't need to depend on the
 * parsing libraries (OpenLayers / ogc-client) directly.
 */

import type { WmtsLayer } from "@camptocamp/ogc-client";

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
