import { LV95, WGS84 } from "@swissgeo/coordinates";
import proj4 from "proj4";

import type { ElevationProfileResponse } from "@/types";

export function reverseProfile(
  profile: ElevationProfileResponse,
): ElevationProfileResponse {
  const totalDist = profile.points.at(-1)?.dist ?? 0;
  const points = [...profile.points]
    .reverse()
    .map((point) => ({ ...point, dist: totalDist - point.dist }))
    .sort((a, b) => a.dist - b.dist);
  return {
    ...profile,
    metadata: {
      ...profile.metadata,
      elevationDifference: -profile.metadata.elevationDifference,
      totalAscent: profile.metadata.totalDescent,
      totalDescent: profile.metadata.totalAscent,
    },
    points,
  };
}

export function buildCSV(profile: ElevationProfileResponse): string {
  return (
    [
      ["Distance", "Altitude", "Easting", "Northing", "Longitude", "Latitude"],
      ...profile.points.map((point) => {
        const [lon, lat] = proj4(LV95.epsg, WGS84.epsg, point.coordinate);
        const [x, y] = [point.coordinate[0], point.coordinate[1]];
        return [
          point.dist,
          point.elevation,
          LV95.roundCoordinateValue(x),
          LV95.roundCoordinateValue(y),
          WGS84.roundCoordinateValue(lon),
          WGS84.roundCoordinateValue(lat),
        ];
      }),
    ]
      .map((row) => row.join(";"))
      .join("\n") + "\n"
  );
}
