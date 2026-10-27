/**
 * Minimal structural type for a hosted MapLibre style document.
 * The viewer only consumes these fields;
 * everything else passes through to `ol-mapbox-style`
 *
 * It is currently used within the map package and the ogc package, thus we share
 * the definition here.
 * */
export interface MapLibreStyleLayer {
  id: string;
  type: string;
  source?: string;
  metadata?: unknown;
  layout?: unknown;
  paint?: unknown;
  filter?: unknown;
  minzoom?: number;
  maxzoom?: number;
}

export interface MapLibreStyleDocument {
  version: 8;
  name?: string;
  metadata?: unknown;
  sources: Record<string, unknown>;
  layers: MapLibreStyleLayer[];
}

export function isMapLibreStyleDocument(
  value: unknown,
): value is MapLibreStyleDocument {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.version === 8 &&
    isRecord(value.sources) &&
    Array.isArray(value.layers) &&
    value.layers.every(
      (layer) =>
        isRecord(layer) &&
        typeof layer.id === "string" &&
        typeof layer.type === "string",
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
