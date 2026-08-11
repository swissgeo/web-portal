import type proj4 from "proj4";

import { describe, expect, it, vi } from "vitest";

import { LV03, LV95, WEBMERCATOR } from "@/proj";
import StandardCoordinateSystem from "@/proj/StandardCoordinateSystem";
import { registerProj4 } from "@/registerProj4";

class TestCoordinateSystem extends StandardCoordinateSystem {
  constructor() {
    super({
      usesMercatorPyramid: false,
      proj4transformationMatrix: "+proj=test",
      label: "test",
      epsgNumber: 9999,
    });
  }
  getResolutionForZoom(): number {
    return 0;
  }
  getZoomForResolution(): number {
    return 0;
  }
  roundCoordinateValue(): number {
    return 0;
  }
}

class NoMatrixCoordinateSystem extends StandardCoordinateSystem {
  constructor() {
    super({
      usesMercatorPyramid: false,
      proj4transformationMatrix: "",
      label: "no-matrix",
      epsgNumber: 9998,
    });
  }
  getResolutionForZoom(): number {
    return 0;
  }
  getZoomForResolution(): number {
    return 0;
  }
  roundCoordinateValue(): number {
    return 0;
  }
}

function createMockProj4() {
  return {
    defs: vi.fn(),
  } as unknown as typeof proj4;
}

describe("registerProj4", () => {
  it("registers default projections (WEBMERCATOR, LV95, LV03)", () => {
    const mockProj4 = createMockProj4();
    registerProj4(mockProj4);
    expect(mockProj4.defs).toHaveBeenCalledWith(
      WEBMERCATOR.epsg,
      WEBMERCATOR.proj4transformationMatrix,
    );
    expect(mockProj4.defs).toHaveBeenCalledWith(
      LV95.epsg,
      LV95.proj4transformationMatrix,
    );
    expect(mockProj4.defs).toHaveBeenCalledWith(
      LV03.epsg,
      LV03.proj4transformationMatrix,
    );
  });

  it("registers only projections with a transformation matrix", () => {
    const mockProj4 = createMockProj4();
    const test = new TestCoordinateSystem();
    const noMatrix = new NoMatrixCoordinateSystem();
    registerProj4(mockProj4, [test, noMatrix]);
    expect(mockProj4.defs).toHaveBeenCalledTimes(1);
    expect(mockProj4.defs).toHaveBeenCalledWith(
      test.epsg,
      test.proj4transformationMatrix,
    );
  });

  it("registers custom projections alongside defaults", () => {
    const mockProj4 = createMockProj4();
    const test = new TestCoordinateSystem();
    registerProj4(mockProj4, [WEBMERCATOR, test]);
    expect(mockProj4.defs).toHaveBeenCalledTimes(2);
  });

  it("skips projections without a transformation matrix", () => {
    const mockProj4 = createMockProj4();
    const noMatrix = new NoMatrixCoordinateSystem();
    registerProj4(mockProj4, [noMatrix]);
    expect(mockProj4.defs).not.toHaveBeenCalled();
  });

  it("rethrows errors thrown by proj4.defs()", () => {
    const mockProj4 = createMockProj4();
    const expectedError = new Error("proj4 failure");
    vi.mocked(mockProj4.defs).mockImplementation(() => {
      throw expectedError;
    });
    expect(() => registerProj4(mockProj4, [LV95])).toThrow(expectedError);
  });

  it("wraps falsy errors in an Error object", () => {
    const mockProj4 = createMockProj4();
    vi.mocked(mockProj4.defs).mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw undefined;
    });
    expect(() => registerProj4(mockProj4, [LV95])).toThrow("Unknown error");
  });
});
