import type { Layer } from "@swissgeo/layers";

import { expect, test } from "vitest";

import * as TimeSliderUtils from "../timeSliderUtils.ts";

const BASE_LAYER_CONFIG: Layer = {
  type: "dataset",
  uuid: "abc",
  humanId: "def",
  isLoading: false,
};

test.each([
  ["2016", "2016"],
  ["all", undefined],
  ["20190222", "2019"],
  ["2016-08-15", "2016"],
])(
  "The years parser for geoadmin style years parses correctly",
  (timestamp, expectedYear) => {
    const year = TimeSliderUtils.getYearFromGeoadminValue(timestamp);
    expect(year).toEqual(expectedYear);
  },
);

test("The years data getter returns the correct data", () => {
  const layers: TimeSliderUtils.LayerWithTime[] = [
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          availableValues: ["2019", "2026", "2016", "1987"],
        },
      },
    },
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          availableValues: ["2026", "2025", "2019", "2016"],
        },
      },
    },
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          availableValues: ["2025", "2019", "2016"],
        },
      },
    },
  ];
  const { yearsJoint, yearsSeparate } =
    TimeSliderUtils.getYearsWithData(layers);
  expect(yearsJoint).toEqual([2016, 2019]);
  expect(yearsSeparate).toEqual([1987, 2025, 2026]);
});

test("The years getter filters the correct data with WMTS timestamps", () => {
  const layers: TimeSliderUtils.LayerWithTime[] = [
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          availableValues: ["2019", "2026", "2016", "1987"],
        },
      },
    },
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          // 2021, 2020, 2019, 2016
          availableValues: ["20211231", "20201231", "20191231", "20161231"],
        },
      },
    },
  ];
  const { yearsJoint, yearsSeparate } =
    TimeSliderUtils.getYearsWithData(layers);
  expect(yearsJoint).toEqual([2016, 2019]);
  expect(yearsSeparate).toEqual([1987, 2020, 2021, 2026]);
});

test('The years getter filters with "all" included', () => {
  const layers: TimeSliderUtils.LayerWithTime[] = [
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          availableValues: ["2019", "2026", "2016", "1987", "all"],
        },
      },
    },
    {
      ...BASE_LAYER_CONFIG,
      dimensions: {
        time: {
          currentValue: "2026",
          // 2021, 2020, 2019, 2016
          availableValues: [
            "20211231",
            "20201231",
            "20191231",
            "20161231",
            "all",
          ],
        },
      },
    },
  ];
  const { yearsJoint, yearsSeparate } =
    TimeSliderUtils.getYearsWithData(layers);
  expect(yearsJoint).toEqual([2016, 2019]);
  expect(yearsSeparate).toEqual([1987, 2020, 2021, 2026]);
});
