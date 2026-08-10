import type { GeoJSONLayer } from "@swissgeo/map";
import type { Distribution } from "@swissgeo/ogc";

import { LV95 } from "@swissgeo/coordinates";
import { geoadminToMapLibreStyle, isMapLibreStyle } from "@swissgeo/map";
import { useGeoJson } from "@swissgeo/ogc";

export type GeoJsonLayerData = Pick<
  GeoJSONLayer,
  "geoJsonData" | "geoJsonStyle" | "mapLibreStyle" | "mapLibreIcons"
>;

export function useGeoJsonData(
  distribution: Ref<Distribution | null>,
  layerId: Ref<string | null>,
) {
  const { geoJsonData } = useGeoJson(distribution);

  // Classify the fetched style once per fetch: an already-standard MapLibre style is
  // passed straight through; a legacy geoadmin "literals" style is converted here.
  const layerData = computed<GeoJsonLayerData | null>(() => {
    const { geoJsonData: features, geoJsonStyle: style } = geoJsonData.value;

    if (!features || Object.keys(features).length === 0) {
      return null;
    }

    if (!style || Object.keys(style).length === 0) {
      return { geoJsonData: features };
    }

    if (isMapLibreStyle(style)) {
      return { geoJsonData: features, mapLibreStyle: style };
    }

    const { style: mapLibreStyle, icons } = geoadminToMapLibreStyle(
      style,
      layerId.value ?? "geojson",
      {
        resolutionToZoom: (resolution) => LV95.getZoomForResolution(resolution),
      },
    );
    return { geoJsonData: features, mapLibreStyle, mapLibreIcons: icons };
  });

  return { layerData };
}
