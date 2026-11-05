import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResetApp } from "../useResetApp.client";

const {
  clearSessionStorage,
  featuresReset,
  dimensionsReset,
  layersReset,
  positionReset,
} = vi.hoisted(() => ({
  clearSessionStorage: vi.fn(),
  featuresReset: vi.fn(),
  dimensionsReset: vi.fn(),
  layersReset: vi.fn(),
  positionReset: vi.fn(),
}));

mockNuxtImport("useRestoreState", () => () => ({
  clear: clearSessionStorage,
}));

vi.mock("@swissgeo/dimension", () => ({
  useDimensionsStore: () => ({ $reset: dimensionsReset }),
}));
vi.mock("@swissgeo/feature", () => ({
  useFeaturesStore: () => ({ $reset: featuresReset }),
}));
vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({ $reset: layersReset }),
}));
vi.mock("@swissgeo/map", () => ({
  usePositionStore: () => ({ $reset: positionReset }),
}));

describe("useResetApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the persisted session state", () => {
    useResetApp().resetApp();
    expect(clearSessionStorage).toHaveBeenCalledOnce();
  });

  it("resets the layer, position and dimensions stores", () => {
    useResetApp().resetApp();
    expect(layersReset).toHaveBeenCalledOnce();
    expect(positionReset).toHaveBeenCalledOnce();
    expect(dimensionsReset).toHaveBeenCalledOnce();
  });

  it("resets the features store so a dangling feature info notice disappears", () => {
    useResetApp().resetApp();
    expect(featuresReset).toHaveBeenCalledOnce();
  });
});
