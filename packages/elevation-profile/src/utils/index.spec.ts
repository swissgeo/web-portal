import { describe, expect, it } from "vitest";

import { formatDistance, formatElevation } from "@/utils/index";

describe("formatDistance", () => {
  it("returns 0.00m for undefined", () => {
    expect(formatDistance(undefined)).toBe("0.00m");
  });

  it("returns 0.00m for NaN", () => {
    expect(formatDistance(NaN)).toBe("0.00m");
  });

  it("returns 0.00m for 0", () => {
    expect(formatDistance(0)).toBe("0.00m");
  });

  it("formats values under 1000 as meters", () => {
    expect(formatDistance(123.456)).toBe("123.46m");
    expect(formatDistance(999.99)).toBe("999.99m");
    expect(formatDistance(1)).toBe("1.00m");
  });

  it("formats values >= 1000 as kilometers", () => {
    expect(formatDistance(1000)).toBe("1.00km");
    expect(formatDistance(12345)).toBe("12.35km");
    expect(formatDistance(1500)).toBe("1.50km");
  });
});

describe("formatElevation", () => {
  it("returns 0.00m for undefined", () => {
    expect(formatElevation(undefined)).toBe("0.00m");
  });

  it("returns 0.00m for NaN", () => {
    expect(formatElevation(NaN)).toBe("0.00m");
  });

  it("returns 0.00m for 0", () => {
    expect(formatElevation(0)).toBe("0.00m");
  });

  it("formats values under 1000 as meters with 2 decimal places", () => {
    expect(formatElevation(500)).toBe("500.00m");
    expect(formatElevation(999.99)).toBe("999.99m");
    expect(formatElevation(1)).toBe("1.00m");
  });

  it("formats values >= 1000 with thousand-separator and m suffix", () => {
    expect(formatElevation(1000)).toBe("1'000m");
    expect(formatElevation(4478)).toBe("4'478m");
    expect(formatElevation(1234.7)).toBe("1'235m");
  });
});
