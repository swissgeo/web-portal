import { describe, expect, it } from "vitest";

import { processTimeInfo } from "../processTimeInfo";

describe("processTimeInfo", () => {
  it("normalizes an ISO defaultTime to the matching YYYYMMDD entry in availableTimes", () => {
    const result = processTimeInfo(
      ref({
        defaultTime: "1970-08-17T00:33:51Z",
        availableTimes: ["19700101", "20240101"],
      }),
    );

    expect(result.currentValue).toBe("19700101");
  });

  it("uses a defaultTime without a year ('current') as-is when it is in availableTimes", () => {
    // shape of the geoadmin WMTS capabilities: newest first, default "current"
    const result = processTimeInfo(
      ref({
        defaultTime: "current",
        availableTimes: ["current", "2026", "2025", "1850"],
      }),
    );

    expect(result.currentValue).toBe("current");
  });

  it("resolves a YYYYMMDD defaultTime to the matching entry in availableTimes", () => {
    const result = processTimeInfo(
      ref({
        defaultTime: "20240101",
        availableTimes: ["20230101", "20240101"],
      }),
    );

    expect(result.currentValue).toBe("20240101");
  });

  it("falls back to the last availableTimes entry when the defaultTime year is not found", () => {
    const result = processTimeInfo(
      ref({
        defaultTime: "1999-01-01T00:00:00Z",
        availableTimes: ["20230101", "20240101"],
      }),
    );

    expect(result.currentValue).toBe("20240101");
  });

  it("uses the raw defaultTime when availableTimes is null", () => {
    const result = processTimeInfo(
      ref({ defaultTime: "20240101", availableTimes: null }),
    );

    expect(result.currentValue).toBe("20240101");
  });

  it("sets availableValues from availableTimes", () => {
    const result = processTimeInfo(
      ref({ defaultTime: null, availableTimes: ["20230101", "20240101"] }),
    );

    expect(result.availableValues).toEqual(["20230101", "20240101"]);
  });
});
