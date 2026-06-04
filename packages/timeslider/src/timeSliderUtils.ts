import type { Layer } from "@swissgeo/layers";

import {
  ALL_YEARS_TIMESTAMP,
  CURRENT_YEAR_TIMESTAMP,
  convertYearToTimestamp,
  getYearFromGeoadminValue,
} from "@swissgeo/shared";

export { convertYearToTimestamp, getYearFromGeoadminValue };

// use the most narrow type needed for this to work
export type LayerWithTime = Pick<Layer, "dimensions" | "uuid">;

/**
 * Create two sets with values that occur in the layers with timestamps
 *
 * `yearsJoint` contains the values that are shared in all the layers `yearsSeparate` contains the
 * values that are exclusive to some layers
 */
export function getYearsWithData(layersWithTimestamps: LayerWithTime[]) {
  const timeConfigs = layersWithTimestamps.map(
    (layer) => layer.dimensions.time,
  );

  if (timeConfigs.length === 0) {
    return {
      yearsJoint: [],
      yearsSeparate: [],
    };
  }

  const yearCounter: Record<string, number> = {};

  for (const timeConfig of timeConfigs) {
    for (const timestamp of timeConfig.availableValues) {
      if (
        timestamp === ALL_YEARS_TIMESTAMP ||
        timestamp === CURRENT_YEAR_TIMESTAMP
      ) {
        // we don't want these for the timeslider
        continue;
      }

      const year = getYearFromGeoadminValue(timestamp);
      if (!year) {
        continue;
      }

      if (year in yearCounter && yearCounter[year]) {
        yearCounter[year]++;
      } else {
        yearCounter[year] = 1;
      }
    }
  }

  const yearsJoint = Object.entries(yearCounter)
    .filter(([_, count]) => {
      return count === timeConfigs.length; // this year is in every time config
    })
    .map(([year, _]) => parseInt(year))
    .sort();

  const yearsSeparate = Object.entries(yearCounter)
    .filter(([_, count]) => {
      return count !== timeConfigs.length; // this year is NOT in every time config
    })
    .map(([year, _]) => parseInt(year))
    .sort();

  return {
    yearsJoint,
    yearsSeparate,
  };
}
