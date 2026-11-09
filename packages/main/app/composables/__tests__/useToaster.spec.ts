import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useToaster } from "../useToaster";

const { toastAdd, toastUpdate, useClipboard } = vi.hoisted(() => ({
  toastAdd: vi.fn().mockReturnValue({ id: "toast-id" }),
  toastUpdate: vi.fn(),
  useClipboard: vi.fn(),
}));
vi.mock("@vueuse/core", () => ({ useClipboard }));

// tests/setup.ts mocks useToaster for all tests. This test needs the real one.
vi.unmock("~/composables/useToaster");

mockNuxtImport("useNuxtApp", () => () => ({
  $i18n: {
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}(${Object.values(params).join()})` : key,
  },
}));
mockNuxtImport("useToast", () => () => ({
  add: toastAdd,
  update: toastUpdate,
}));

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

  it("shows the plain layer error without a request URL", () => {
    useToaster().showLayerError(null);

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ description: "error.layerLoad" }),
    );
    expect(toastAdd.mock.calls[0]?.[0]).not.toHaveProperty("actions");
  });

  it("names the service host and copies the full request URL", async () => {
    const url = "https://wms.example.test/wms?REQUEST=GetCapabilities";
    const copied = ref(false);
    const copy = vi.fn(() => {
      copied.value = true;
    });
    useClipboard.mockReturnValue({ copy, copied });

    useToaster().showLayerError(url);

    const options = toastAdd.mock.calls[0]?.[0];
    expect(options.description).toBe(
      "error.layerLoad\nerror.service(wms.example.test)",
    );
    expect(options.actions).toEqual([
      expect.objectContaining({ label: "error.copyRequestUrl" }),
    ]);
    await options.actions[0].onClick();
    expect(copy).toHaveBeenCalledWith(url);
    expect(toastUpdate).toHaveBeenCalledWith("toast-id", {
      duration: Infinity,
      actions: [
        expect.objectContaining({
          label: "error.requestUrlCopied",
          icon: "i-lucide-check",
        }),
      ],
    });
  });

  it("keeps the copy label when the copy fails", async () => {
    const copy = vi.fn();
    useClipboard.mockReturnValue({ copy, copied: ref(false) });

    useToaster().showLayerError("https://wms.example.test/wms");
    await toastAdd.mock.calls[0]?.[0].actions[0].onClick();

    expect(copy).toHaveBeenCalled();
    expect(toastUpdate).not.toHaveBeenCalled();
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
