import { expect, test } from "vitest";

import type { Dimension } from "@/types";

import * as TimeSliderUtils from "@/timeSliderUtils";
import * as TimeUtils from "@/timeUtils";

test.each([
  ["2016", "2016"],
  ["all", undefined],
  ["20190222", "2019"],
  ["2016-08-15", "2016"],
])(
  "The years parser for geoadmin style years parses correctly",
  (timestamp, expectedYear) => {
    const year = TimeUtils.getYearFromGeoadminValue(timestamp);
    expect(year).toEqual(expectedYear);
  },
);

test("The years data getter returns the correct data", () => {
  const timeConfigs: Dimension[] = [
    {
      currentValue: "2026",
      availableValues: ["2019", "2026", "2016", "1987"],
    },
    {
      currentValue: "2026",
      availableValues: ["2026", "2025", "2019", "2016"],
    },
    {
      currentValue: "2026",
      availableValues: ["2025", "2019", "2016"],
    },
  ];
  const { yearsJoint, yearsSeparate } =
    TimeSliderUtils.getYearsWithData(timeConfigs);
  expect(yearsJoint).toEqual([2016, 2019]);
  expect(yearsSeparate).toEqual([1987, 2025, 2026]);
});

test("The years getter filters the correct data with WMTS timestamps", () => {
  const timeConfigs: Dimension[] = [
    {
      currentValue: "2026",
      availableValues: ["2019", "2026", "2016", "1987"],
    },
    {
      currentValue: "2026",
      availableValues: ["20211231", "20201231", "20191231", "20161231"],
    },
  ];
  const { yearsJoint, yearsSeparate } =
    TimeSliderUtils.getYearsWithData(timeConfigs);
  expect(yearsJoint).toEqual([2016, 2019]);
  expect(yearsSeparate).toEqual([1987, 2020, 2021, 2026]);
});

test('The years getter filters with "all" included', () => {
  const timeConfigs: Dimension[] = [
    {
      currentValue: "2026",
      availableValues: ["2019", "2026", "2016", "1987", "all"],
    },
    {
      currentValue: "2026",
      availableValues: ["20211231", "20201231", "20191231", "20161231", "all"],
    },
  ];
  const { yearsJoint, yearsSeparate } =
    TimeSliderUtils.getYearsWithData(timeConfigs);
  expect(yearsJoint).toEqual([2016, 2019]);
  expect(yearsSeparate).toEqual([1987, 2020, 2021, 2026]);
});
