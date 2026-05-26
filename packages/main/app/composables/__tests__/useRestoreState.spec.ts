import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { watcherCallbackRef } = vi.hoisted(() => {
  return {
    watcherCallbackRef: { fn: null as ((_state: unknown) => void) | null },
  };
});

vi.mock("@vueuse/core", async (importOriginal) => {
  const original = await importOriginal();
  return {
    // @ts-expect-error It works and this is a test
    ...original,
    watchDebounced: (_getter: unknown, callback: (_state: unknown) => void) => {
      watcherCallbackRef.fn = callback;
    },
  };
});

const { mocks } = await vi.hoisted(async () => {
  const { nuxtMocks } = await import("../../../tests/mock-nuxt-imports");
  return { mocks: nuxtMocks };
});

const STORAGE_KEY = "swissgeo_app_state";

const mockImportState = vi.fn();
const mockExportState = ref({
  version: 2,
  map: { center: [2600000, 1200000] as [number, number], zoom: 8, rotation: 0 },
  layers: [],
});

mockNuxtImport("useNuxtApp", mocks.useNuxtApp);
mockNuxtImport("useToaster", mocks.useToaster);
mockNuxtImport("useRoute", mocks.useRoute);
mockNuxtImport("useRouter", mocks.useRouter);
mockNuxtImport("onNuxtReady", mocks.onNuxtReady);

vi.mock("~/composables/useStateConfig", () => ({
  useStateConfig: () => ({
    exportState: mockExportState,
    importState: mockImportState,
  }),
}));

describe("useRestoreState", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("state restoration on load", () => {
    it("does not call importState when sessionStorage is empty", async () => {
      const { restore } = useRestoreState();
      await restore();
      expect(mockImportState).not.toHaveBeenCalled();
    });

    it("calls importState with the stored JSON string when state is present in sessionStorage", async () => {
      const state = {
        version: "1.0",
        state: {
          map: { center: [2420001, 1030001], zoom: 10, rotation: 0 },
          layers: [],
        },
      };
      const stored = JSON.stringify(state);
      sessionStorage.setItem(STORAGE_KEY, stored);

      const { restore } = useRestoreState();
      await restore();

      expect(mockImportState).toHaveBeenCalledWith(state);
    });

    it("calls importState with the stored JSON string when state is present", async () => {
      const state = {
        version: "1.0",
        state: {
          map: { center: [2420001, 1030001], zoom: 10, rotation: 0 },
          layers: [],
        },
      };
      const stored = JSON.stringify(state);
      sessionStorage.setItem(STORAGE_KEY, stored);

      const { restore } = useRestoreState();
      await restore();

      expect(mockImportState).toHaveBeenCalledWith(state);
    });

    it("removes the corrupt key and does not throw when importState fails", async () => {
      sessionStorage.setItem(STORAGE_KEY, "not-valid-json");
      mockImportState.mockRejectedValueOnce(new Error("Parse error"));

      const { restore } = useRestoreState();

      await expect(restore()).resolves.not.toThrow();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("useRestoreState reactive persistence", () => {
    it("does not set up a watcher automatically after the hook runs", async () => {
      const { restore } = useRestoreState();
      await restore();
      expect(watcherCallbackRef.fn).toBeNull();
    });

    it("sets up a watcher with the listen callback", () => {
      const { listenToChange } = useRestoreState();
      listenToChange();
      expect(watcherCallbackRef.fn).not.toBeNull();
    });

    it("writes state to sessionStorage when the watcher fires", async () => {
      const { restore } = useRestoreState();
      await restore();
      const state = mockExportState.value;

      watcherCallbackRef.fn!(state);

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state));
    });

    it("saves the restored state to the session storage", async () => {
      const { restore } = useRestoreState();
      await restore(); // no stored state → isImporting stays false

      watcherCallbackRef.fn!(mockExportState.value);

      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });
  });
});
