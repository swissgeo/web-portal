import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToaster } from "../useToaster";

const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }));

// tests/setup.ts mocks useToaster for all tests. This test needs the real one.
vi.unmock("~/composables/useToaster");

mockNuxtImport("useNuxtApp", () => () => ({
  $i18n: { t: (key: string) => key },
}));
mockNuxtImport("useToast", () => () => ({ add: toastAdd }));

describe("useToaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps an error toast open until the user closes it", () => {
    useToaster().showError("Failed");

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: "error", duration: Infinity }),
    );
  });

  it("keeps an error toast from add() open", () => {
    useToaster().add({ title: "Failed", color: "error" });

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ duration: Infinity }),
    );
  });

  it("links the map unavailable error to map.geo.admin.ch", () => {
    useToaster().showMapUnavailable();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "map-unavailable",
        description: "error.mapUnavailable",
        duration: Infinity,
        actions: [expect.objectContaining({ to: "https://map.geo.admin.ch" })],
      }),
    );
  });

  it("lets a success toast use the default duration", () => {
    useToaster().showSuccess("Done");
    useToaster().add({ title: "Done", color: "success" });

    expect(toastAdd).toHaveBeenCalledTimes(2);
    for (const [options] of toastAdd.mock.calls) {
      expect(options).not.toHaveProperty("duration");
    }
  });
});
