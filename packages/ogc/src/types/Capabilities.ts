/**
 * Expose some common types so that consumers don't need to depend on the
 * parsing libraries (OpenLayers / ogc-client) directly.
 */

export interface WMSCapabilityDimension {
  name: string;
  units: string;
  unitSymbol?: string;
  default?: string;
  multipleValues?: boolean;
  values?: string; // This usually contains the time string "2023-01-01/2023-12-31/P1D"
}

// WMTS layer dimensions are now parsed by ogc-client. We surface its shape so
// consumers keep a stable `@swissgeo/ogc` import and don't need to depend on
// ogc-client directly. Fields are `identifier` / `defaultValue` / `values`.
// (ogc-client does not export `LayerDimension` by name, so we derive it.)
import type { WmtsLayer } from "@camptocamp/ogc-client";

export type WMTSCapabilityDimension = NonNullable<
  WmtsLayer["dimensions"]
>[number];
