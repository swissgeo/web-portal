import type { GeoJSONLayer, ShapeIconSpec } from "@swissgeo/map";
import type { Distribution } from "@swissgeo/ogc";

import { useGeoJson } from "@swissgeo/ogc";

export type GeoJsonLayerData = Pick<
  GeoJSONLayer,
  "geoJsonData" | "mapLibreStyle" | "mapLibreIcons"
>;

/**
 * Maps a GeoJSON distribution to the layer data the map module consumes: the
 * GeoJSON features plus the MapLibre style payload fetched from the
 * distribution's `styledBy` link. A distribution without a usable style is a
 * hard error and is reported through `onError`.
 */
export function useOgcGeoJsonData(
  distribution: Ref<Distribution | null>,
  onError: (error: unknown) => void,
) {
  const { geoJsonData, mapLibreStyle, mapLibreIcons, error } =
    useGeoJson(distribution);

  watch(
    error,
    () => {
      if (error.value) {
        onError(error.value);
      }
    },
    { immediate: true },
  );

  const geoJsonLayerData = computed<GeoJsonLayerData | null>(() => {
    if (!geoJsonData.value || !mapLibreStyle.value) {
      return null;
    }
    return {
      // The payload types crossing the package boundary are opaque records;
      // narrow them to the map module's expectations here.
      geoJsonData: geoJsonData.value as unknown as GeoJSONLayer["geoJsonData"],
      mapLibreStyle: mapLibreStyle.value,
      mapLibreIcons: mapLibreIcons.value as ShapeIconSpec[],
    };
  });

  return {
    geoJsonLayerData,
  };
}
