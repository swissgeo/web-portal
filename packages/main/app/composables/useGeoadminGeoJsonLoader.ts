import type { GeoJSONLayer } from "@swissgeo/map";

import { LV95 } from "@swissgeo/coordinates";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import { geoadminToMapLibreStyle } from "@swissgeo/map";
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

// Data URLs mostly follow <base>/<id>/<id>_de.json; a few layers differ.
const DATA_URL_OVERRIDES: Record<string, string> = {
  "ch.swisstopo.treasurehunt":
    "https://data.geo.admin.ch/ch.swisstopo.treasurehunt/json/2056/ch.swisstopo.treasurehunt.json",
};
const DATA_URL = (id: string) =>
  DATA_URL_OVERRIDES[id] ?? `https://data.geo.admin.ch/${id}/${id}_de.json`;

// Browser fetches to the geoadmin hosts are CORS-blocked, so go through the
// same-origin POC proxy (server/api/wpa/v1/poc/geojson.get.ts).
const PROXIED = (url: string) =>
  `/api/wpa/v1/poc/geojson?url=${encodeURIComponent(url)}`;

export function useGeoadminGeoJsonLoader() {
  const mapViewStore = useMapViewStore();

  async function loadLayer(
    layerId: string,
    options: { legacy?: boolean } = {},
  ): Promise<void> {
    if (!layerId) {
      return;
    }
    try {
      const [geoadminStyle, geoJsonData] = await Promise.all([
        fetch(PROXIED(STYLE_URL(layerId))).then((res) => res.json()),
        fetch(PROXIED(DATA_URL(layerId))).then((res) => res.json()),
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

  return {
    loadLayer,
  };
}
