import type { GeoJSONLayer } from "@swissgeo/map";

import log from "@swissgeo/log";
import { geoadminToMapLibreStyle } from "@swissgeo/map";
import geoJsonData from "~/assets/poc/hydroweb-grundwasser.data.json";
import geoadminStyle from "~/assets/poc/hydroweb-grundwasser.style.json";
import { useMapViewStore } from "~/stores/mapView";

// The geoadmin style type isn't a named export of @swissgeo/map; derive it from
// the converter's signature so we don't depend on where the type physically lives.
type GeoadminStyle = Parameters<typeof geoadminToMapLibreStyle>[0];

/**
 * POC (GPS-732) dev-only harness. Converts a real geoadmin "literals" style to a
 * standard MapLibre style at runtime and injects a GeoJSON layer that renders via
 * `ol-mapbox-style`, side-by-side with the legacy converter. This proves the
 * proprietary -> MapLibre pipeline end-to-end without touching live OGC records.
 */
export function useMapLibreGeoJsonDemo() {
  const mapViewStore = useMapViewStore();

  function addDemoLayer(): void {
    const sourceId = "poc-maplibre-grundwasser";
    const { style, icons } = geoadminToMapLibreStyle(
      geoadminStyle as GeoadminStyle,
      sourceId,
    );

    log.info({
      title: "useMapLibreGeoJsonDemo",
      messages: ["Converted geoadmin style to MapLibre", style, icons],
    });

    const layer: GeoJSONLayer = {
      format: "GeoJSON",
      layerId: sourceId,
      uuid: crypto.randomUUID(),
      opacity: 1,
      isVisible: true,
      displayName: "POC MapLibre GeoJSON (grundwasser)",
      geoJsonData: geoJsonData as GeoJSONLayer["geoJsonData"],
      mapLibreStyle: style,
      mapLibreIcons: icons,
    };

    mapViewStore.addLayerToTop(layer);
  }

  return {
    addDemoLayer,
  };
}
