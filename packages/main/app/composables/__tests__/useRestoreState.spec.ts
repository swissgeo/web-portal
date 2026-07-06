import type * as VueUseCore from "@vueuse/core";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useLayerStore } from "@swissgeo/layers";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  importStateFromBase64Mock,
  importStateFromServiceMock,
  watcherCallbackRef,
  watcherOptionsRef,
} = vi.hoisted(() => {
  return {
    importStateFromBase64Mock: vi.fn(),
    importStateFromServiceMock: vi.fn(),
    watcherCallbackRef: { fn: null as ((_state: unknown) => void) | null },
    watcherOptionsRef: { value: null as unknown },
  };
});

vi.mock("@vueuse/core", async (importOriginal) => {
  const original = await importOriginal<typeof VueUseCore>();
  return {
    ...original,
    watchDebounced: (
      _getter: unknown,
      callback: (_state: unknown) => void,
      options: unknown,
    ) => {
      watcherCallbackRef.fn = callback;
      watcherOptionsRef.value = options;
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

const storedState = {
  version: "1.0",
  state: {
    map: { center: [2420001, 1030001], zoom: 10, rotation: 0 },
    layers: [],
  },
};

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

vi.mock("~/composables/stateImport/importStateFromBase64", () => ({
  importStateFromBase64: importStateFromBase64Mock,
}));

vi.mock("~/composables/stateImport/importStateFromService", () => ({
  importStateFromService: importStateFromServiceMock,
}));

describe("useRestoreState", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    localStorage.clear();
    watcherCallbackRef.fn = null;
    watcherOptionsRef.value = null;
    vi.clearAllMocks();
    mockImportState.mockReset();
    importStateFromBase64Mock.mockReset();
    importStateFromServiceMock.mockReset();
    importStateFromBase64Mock.mockResolvedValue(false);
    importStateFromServiceMock.mockResolvedValue(false);
  });

  describe("state restoration on load", () => {
    it("does not call importState when sessionStorage is empty", async () => {
      const { restore } = useRestoreState();
      await restore();
      expect(mockImportState).not.toHaveBeenCalled();
    });

    it("restores state from sessionStorage", async () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));

      const { restore } = useRestoreState();

      await expect(restore()).resolves.toBe(true);
      expect(mockImportState).toHaveBeenCalledOnce();
      expect(mockImportState).toHaveBeenCalledWith(storedState);
    });

    it.each([
      { source: "base64", base64Restored: true, serviceRestored: false },
      { source: "state service", base64Restored: false, serviceRestored: true },
    ])(
      "restores $source state before sessionStorage",
      async ({ base64Restored, serviceRestored }) => {
        importStateFromBase64Mock.mockResolvedValue(base64Restored);
        importStateFromServiceMock.mockResolvedValue(serviceRestored);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));

        const { restore } = useRestoreState();

        await expect(restore()).resolves.toBe(true);
        expect(importStateFromBase64Mock).toHaveBeenCalledOnce();
        expect(importStateFromServiceMock).toHaveBeenCalledTimes(
          base64Restored ? 0 : 1,
        );
        expect(mockImportState).not.toHaveBeenCalled();
      },
    );

    it("removes the corrupt key and does not throw when importState fails", async () => {
      sessionStorage.setItem(STORAGE_KEY, "not-valid-json");
      mockImportState.mockRejectedValueOnce(new Error("Parse error"));

      const { restore } = useRestoreState();

      await expect(restore()).resolves.not.toThrow();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("useRestoreState reactive persistence", () => {
    it("does not set up a watcher when only restore is called", async () => {
      const { restore } = useRestoreState();
      await restore();
      expect(watcherCallbackRef.fn).toBeNull();
    });

    it("sets up a watcher with the listen callback", () => {
      const { listenToChange } = useRestoreState();
      listenToChange();
      expect(watcherCallbackRef.fn).not.toBeNull();
    });

    it("sets up the watcher without immediate persistence", () => {
      const { listenToChange } = useRestoreState();
      listenToChange();

      expect(watcherOptionsRef.value).toEqual({
        deep: true,
        debounce: 500,
        immediate: false,
      });
    });

    it("writes state to sessionStorage when the watcher fires", () => {
      const { listenToChange } = useRestoreState();
      listenToChange();
      const state = mockExportState.value;

      watcherCallbackRef.fn!(state);

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state));
    });

    it("does not write persisted state to localStorage", () => {
      const { listenToChange } = useRestoreState();
      listenToChange();

      watcherCallbackRef.fn!(mockExportState.value);

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe(
        JSON.stringify(mockExportState.value),
      );
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("does not persist while layer import options are pending", () => {
      const layerStore = useLayerStore();
      layerStore.addImportOption("importing-layer", { isVisible: true });
      const { listenToChange } = useRestoreState();
      listenToChange();

      watcherCallbackRef.fn!(mockExportState.value);

      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("persists after restore when listening is started", async () => {
      const { restore, listenToChange } = useRestoreState();
      await restore();
      listenToChange();

      watcherCallbackRef.fn!(mockExportState.value);

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe(
        JSON.stringify(mockExportState.value),
      );
    });
  });
});
