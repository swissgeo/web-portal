import { describe, it, expect, vi } from "vitest";

import type { PositionStore } from "@/stores/position";

import resolution from "../../position/getters/resolution";

describe("resolution", () => {
  it("should return the resolution for the current zoom and center", () => {
    const mockProjection = {
      getResolutionForZoom: vi.fn().mockReturnValue(100),
    };

    const mockStore = {
      projection: mockProjection,
      zoom: 5,
      center: [0, 0],
    } as unknown as PositionStore;

    const result = resolution.call(mockStore);

    expect(mockProjection.getResolutionForZoom).toHaveBeenCalledWith(5, [0, 0]);
    expect(result).toBe(100);
  });
});
