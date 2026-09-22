import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadIconSetsMock } = vi.hoisted(() => ({
  loadIconSetsMock: vi.fn(),
}));

mockNuxtImport("defineNuxtPlugin", () => (plugin: unknown) => plugin);
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { iconServiceEndpoint: "https://icons.test/sets.json" },
}));

vi.mock("@swissgeo/drawing", () => ({
  useIconsStore: () => ({ loadIconSets: loadIconSetsMock }),
}));

import iconsPlugin from "~/plugins/icons.client";

describe("icons client plugin", () => {
  beforeEach(() => {
    loadIconSetsMock.mockReset();
  });

  it("loads icon sets from runtime configuration after Pinia", async () => {
    expect(iconsPlugin).toMatchObject({
      dependsOn: ["pinia"],
      name: "icons",
    });

    await iconsPlugin.setup?.({} as never);

    expect(loadIconSetsMock).toHaveBeenCalledOnce();
    expect(loadIconSetsMock).toHaveBeenCalledWith(
      "https://icons.test/sets.json",
    );
  });

  it("allows startup to finish while icon loading is pending", async () => {
    let finishLoading!: () => void;
    loadIconSetsMock.mockReturnValue(
      new Promise<void>((resolve) => {
        finishLoading = resolve;
      }),
    );

    let startupFinished = false;
    const startup = Promise.resolve(iconsPlugin.setup?.({} as never)).then(
      () => {
        startupFinished = true;
      },
    );

    await Promise.resolve();
    try {
      expect(startupFinished).toBe(true);
    } finally {
      finishLoading();
      await startup;
    }
  });
});
