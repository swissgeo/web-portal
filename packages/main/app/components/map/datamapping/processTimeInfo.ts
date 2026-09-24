import type { Dimension } from "@swissgeo/dimension";

import {
  convertYearToTimestamp,
  getYearFromGeoadminValue,
} from "@swissgeo/dimension";
import log, { LogPreDefinedColor } from "@swissgeo/log";

/**
 * Process the dimensions and turn the into a time info that is being passed to the dimensions store
 */
export function processTimeInfo(timeInfo: Ref<TimeInfo>) {
  const { defaultTime, availableTimes } = timeInfo.value;

  const dimension: Partial<Dimension> = {};

  if (availableTimes) {
    dimension.availableValues = availableTimes;
  }

  if (availableTimes?.length && !defaultTime) {
    dimension.currentValue = availableTimes[availableTimes.length - 1];
  } else if (defaultTime) {
    if (availableTimes?.length) {
      const year = getYearFromGeoadminValue(defaultTime);
      const matched = year
        ? convertYearToTimestamp(availableTimes, parseInt(year))
        : undefined;
      dimension.currentValue =
        matched ?? availableTimes[availableTimes.length - 1] ?? defaultTime;
    } else {
      dimension.currentValue = defaultTime;
    }
  }
  log.debug({
    title: "processTimeInfo",
    titleColor: LogPreDefinedColor.Yellow,
    messages: [
      "Sending update of dimensions from the capabilities",
      timeInfo.value,
    ],
  });
  return dimension;
}
