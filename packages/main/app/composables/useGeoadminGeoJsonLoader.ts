import type { GeoJSONLayer, MapLibreConversionNote } from "@swissgeo/map";

import { LV95 } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import {
  geoadminToMapLibreConversionNotes,
  geoadminToMapLibreStyle,
} from "@swissgeo/map";
import { useMapViewStore } from "~/stores/mapView";

/**
 * POC (GPS-732) dev-only loader. Fetches a real geoadmin GeoJSON layer's data +
 * literals style straight from the public endpoints and renders it, either via the
 * new MapLibre path (converted) or the legacy OlStyleForPropertyValue path — so the
 * full list of ~60 layers can be eyeballed from the debug panel without the OGC
 * record plumbing.
 */
type GeoadminStyle = Parameters<typeof geoadminToMapLibreStyle>[0];

const STYLE_URL = (id: string) =>
  `https://api3.geo.admin.ch/static/vectorStyles/${id}.json`;

// Fallback data URLs mostly follow <base>/<id>/<id>_de.json, but several layers differ
// (e.g. ch.bfe.ladestellen-elektromobilitaet lives under a /data/ segment). The real
// URL is resolved from geoadmin's layersConfig below; this guess is only used when that
// lookup fails.
const DATA_URL = (id: string) =>
  `https://data.geo.admin.ch/${id}/${id}_de.json`;

// geoadmin's authoritative layer catalog: each GeoJSON layer carries the exact
// `geojsonUrl` + `styleUrl` (the same values map.geo.admin.ch uses), so we don't have
// to guess per-layer URL patterns.
const LAYERS_CONFIG_URL =
  "https://api3.geo.admin.ch/rest/services/api/MapServer/layersConfig?lang=de";

interface LayerConfigEntry {
  geojsonUrl?: string;
  styleUrl?: string;
}

// Browser fetches to the geoadmin hosts are CORS-blocked, so go through the
// same-origin POC proxy (server/api/wpa/v1/poc/geojson.get.ts).
const PROXIED = (url: string) =>
  `/api/wpa/v1/poc/geojson?url=${encodeURIComponent(url)}`;

// styleUrl in layersConfig is protocol-relative (e.g. //api3.geo.admin.ch/...).
const absoluteUrl = (url: string): string =>
  url.startsWith("//") ? `https:${url}` : url;

// Fetched once per session; the catalog is large but the debug picker reuses it.
let layersConfigCache: Promise<Record<string, LayerConfigEntry>> | undefined;

function loadLayersConfig(): Promise<Record<string, LayerConfigEntry>> {
  if (!layersConfigCache) {
    layersConfigCache = fetch(PROXIED(LAYERS_CONFIG_URL))
      .then((res) => res.json() as Promise<Record<string, LayerConfigEntry>>)
      .catch((error) => {
        log.warn({
          title: "useGeoadminGeoJsonLoader",
          titleColor: LogPreDefinedColor.Orange,
          messages: [
            "Failed to load layersConfig; falling back to URL guesses",
            error,
          ],
        });
        return {};
      });
  }
  return layersConfigCache;
}

export function useGeoadminGeoJsonLoader() {
  const mapViewStore = useMapViewStore();

  // Resolve the exact style + data URLs from geoadmin's layersConfig, falling back to
  // the guessed patterns when the catalog is unavailable or lacks the layer.
  async function resolveUrls(
    layerId: string,
  ): Promise<{ styleUrl: string; dataUrl: string }> {
    const entry = (await loadLayersConfig())[layerId];
    return {
      styleUrl: entry?.styleUrl
        ? absoluteUrl(entry.styleUrl)
        : STYLE_URL(layerId),
      dataUrl: entry?.geojsonUrl
        ? absoluteUrl(entry.geojsonUrl)
        : DATA_URL(layerId),
    };
  }

  async function loadLayer(
    layerId: string,
    options: { legacy?: boolean } = {},
  ): Promise<void> {
    if (!layerId) {
      return;
    }
    try {
      const { styleUrl, dataUrl } = await resolveUrls(layerId);
      const [geoadminStyle, geoJsonData] = await Promise.all([
        fetch(PROXIED(styleUrl)).then((res) => res.json()),
        fetch(PROXIED(dataUrl)).then((res) => res.json()),
      ]);

      const base = {
        format: "GeoJSON" as const,
        layerId: `${layerId}${options.legacy ? "-legacy" : "-maplibre"}`,
        uuid: crypto.randomUUID(),
        opacity: 1,
        isVisible: true,
        displayName: `${layerId}${options.legacy ? " (legacy)" : " (MapLibre)"}`,
        geoJsonData: geoJsonData as GeoJSONLayer["geoJsonData"],
      };

      if (options.legacy) {
        const layer: GeoJSONLayer = {
          ...base,
          geoJsonStyle: geoadminStyle as GeoadminStyle,
        };
        mapViewStore.addLayerToTop(layer);
        return;
      }

      const { style, icons } = geoadminToMapLibreStyle(
        geoadminStyle as GeoadminStyle,
        layerId,
        {
          resolutionToZoom: (resolution) =>
            LV95.getZoomForResolution(resolution),
        },
      );
      const layer: GeoJSONLayer = {
        ...base,
        mapLibreStyle: style,
        mapLibreIcons: icons,
      };
      mapViewStore.addLayerToTop(layer);
    } catch (error) {
      log.error({
        title: "useGeoadminGeoJsonLoader",
        titleColor: LogPreDefinedColor.Rose,
        messages: [`Failed to load ${layerId}`, error],
      });
    }
  }

  // Fetch the raw geoadmin style for a layer and convert it to a MapLibre style,
  // so the debug panel can show both side by side without adding a layer.
  async function fetchStyles(layerId: string): Promise<{
    geoadminStyle: unknown;
    mapLibreStyle: unknown;
    conversionNotes: MapLibreConversionNote[];
  }> {
    const { styleUrl } = await resolveUrls(layerId);
    const geoadminStyle = await fetch(PROXIED(styleUrl)).then((res) =>
      res.json(),
    );
    const options = {
      resolutionToZoom: (resolution: number) =>
        LV95.getZoomForResolution(resolution),
    };
    const { style } = geoadminToMapLibreStyle(
      geoadminStyle as GeoadminStyle,
      layerId,
      options,
    );
    const conversionNotes = geoadminToMapLibreConversionNotes(
      geoadminStyle as GeoadminStyle,
      options,
    );
    return { geoadminStyle, mapLibreStyle: style, conversionNotes };
  }

  return {
    loadLayer,
    fetchStyles,
  };
}
