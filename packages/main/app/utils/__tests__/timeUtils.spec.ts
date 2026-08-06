import type {
  WMSCapabilityDimension,
  WMTSCapabilityDimension,
} from "@swissgeo/ogc";

import { ALL_YEARS_TIMESTAMP } from "@swissgeo/dimension";
import { describe, expect, it, vi } from "vitest";

import {
  getTimeInfoFromWMSCapabilities,
  getTimeInfoFromWMTSCapabilities,
} from "../timeUtils";

vi.mock("@swissgeo/log", () => ({
  default: { warn: vi.fn() },
  LogPreDefinedColor: { Red: "red" },
}));

describe("getTimeInfoFromWMTSCapabilities", () => {
  it("returns no time information when dimensions are empty", () => {
    expect(getTimeInfoFromWMTSCapabilities([])).toEqual({
      availableTimes: null,
      defaultTime: null,
    });
  });

  it("returns the values and default from the first dimension", () => {
    const dimensions: WMTSCapabilityDimension[] = [
      {
        Identifier: "Time",
        Default: "2023",
        Value: ["2021", "2022", "2023"],
      },
    ];

    expect(getTimeInfoFromWMTSCapabilities(dimensions)).toEqual({
      availableTimes: ["2021", "2022", "2023"],
      defaultTime: "2023",
    });
  });
});

describe("getTimeInfoFromWMSCapabilities", () => {
  it("returns no time information when no time dimension exists", () => {
    const dimensions: WMSCapabilityDimension[] = [
      {
        name: "elevation",
        units: "metres",
        values: "0,100,200",
      },
    ];

    expect(getTimeInfoFromWMSCapabilities(dimensions)).toEqual({
      availableTimes: null,
      defaultTime: null,
    });
  });

  it("expands a year range and retains its configured default", () => {
    const dimensions: WMSCapabilityDimension[] = [
      {
        name: "TIME",
        units: "ISO8601",
        default: "2022",
        values: "2021/2023",
      },
    ];

    expect(getTimeInfoFromWMSCapabilities(dimensions)).toEqual({
      availableTimes: ["2021", "2022", "2023", ALL_YEARS_TIMESTAMP],
      defaultTime: "2022",
    });
  });

  it("parses a year list and uses all years when no default exists", () => {
    const dimensions: WMSCapabilityDimension[] = [
      {
        name: "time",
        units: "ISO8601",
        values: "2019,2021,2024",
      },
    ];

    expect(getTimeInfoFromWMSCapabilities(dimensions)).toEqual({
      availableTimes: ["2019", "2021", "2024", ALL_YEARS_TIMESTAMP],
      defaultTime: ALL_YEARS_TIMESTAMP,
    });
  });

  it("ignores a descending year range", () => {
    const dimensions: WMSCapabilityDimension[] = [
      {
        name: "time",
        units: "ISO8601",
        values: "2024/2021",
      },
    ];

    expect(getTimeInfoFromWMSCapabilities(dimensions)).toEqual({
      availableTimes: [],
      defaultTime: null,
    });
  });
});
