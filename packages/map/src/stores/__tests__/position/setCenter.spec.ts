import type { SingleCoordinate } from "@swissgeo/coordinates";

import { describe, it, expect } from "vitest";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import setCenter from "../../position/actions/setCenter";

describe("setCenter", () => {
  it("should set center to a valid LV95 coordinate", () => {
    const validCenter: SingleCoordinate = [2600000, 1200000];
    setCenter.call(positionStore, validCenter, mockDispatcher);
    expect(positionStore.center).toEqual(validCenter);
  });

  it("should not set center to an invalid LV95 coordinate", () => {
    const invalidCenter: SingleCoordinate = [Infinity, -Infinity];
    setCenter.call(positionStore, invalidCenter, mockDispatcher);
    expect(positionStore.center).not.toEqual(invalidCenter);
  });

  it("should not set center to an invalid format", () => {
    // @ts-expect-error Testing invalid format
    const invalidFormat: SingleCoordinate = [6];
    setCenter.call(positionStore, invalidFormat, mockDispatcher);
    expect(positionStore.center).not.toEqual(invalidFormat);
  });
});
