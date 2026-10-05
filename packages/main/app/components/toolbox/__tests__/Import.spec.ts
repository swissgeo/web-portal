import type { ComponentPublicInstance } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import { beforeEach, describe, it, expect, vi } from "vitest";

import type { SwissgeoUrlValidationResult } from "@/composables/useImportDrawing";

import Import from "@/components/toolbox/import/Import.vue";

type ImportVm = ComponentPublicInstance & {
  onImportDrawing: (_asAdmin?: boolean) => Promise<void>;
  handleImport: () => Promise<void>;
  handleFileUrlImport: () => Promise<void>;
  selectedFile: File | undefined;
  fileUrl: string;
};

const importFileSpy = vi.fn();
const importFileUrlSpy = vi.fn();
vi.mock("@/composables/useFileImport", () => ({
  useFileImport: vi.fn(() => ({
    importFile: importFileSpy,
    importFileUrl: importFileUrlSpy,
  })),
}));

const { drawingImport } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    drawingImport: {
      url: ref(""),
      isLoading: ref(false),
      errorMessage: ref(""),
      successMessage: ref(""),
      importLegacyDrawing: vi.fn(),
      importSwissgeoDrawing: vi.fn(),
      isCheckingUrl: ref(false),
      isUrlOnValidLegacyDomain: ref(false),
      swissGeoUrlValidation: ref<SwissgeoUrlValidationResult>({
        isValid: false,
        drawingId: "",
        adminId: "",
        adminIdProvided: false,
      }),
    },
  };
});
vi.mock("@/composables/useImportDrawing", () => ({
  useImportDrawing: () => drawingImport,
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("~/stores/toolbox", () => ({
  useToolboxStore: vi.fn(() => ({
    closeDetailPanel: vi.fn(),
  })),
}));

const toastAdd = vi.fn();
mockNuxtImport("useToaster", () => () => ({ add: toastAdd }));

const globalStubs = {
  UCard: { template: "<div><slot /></div>" },
  UButton: { template: "<button><slot /></button>" },
  UFileUpload: { template: "<div><slot /></div>" },
  UInput: { template: "<input />" },
  UTabs: { template: "<div><slot /></div>" },
};

describe("Import.vue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    drawingImport.url.value = "";
    drawingImport.isCheckingUrl.value = false;
    drawingImport.isUrlOnValidLegacyDomain.value = false;
    drawingImport.swissGeoUrlValidation.value = {
      isValid: false,
      drawingId: "",
      adminId: "",
      adminIdProvided: false,
    };
  });
  it("renders correctly", () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows error toast when no file is selected", async () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    await (wrapper.vm as ImportVm).handleImport();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "error",
        title: "toolbox.import.errorMessages.noFileSelected",
      }),
    );
  });

  it("calls importFile when a file is selected and import is triggered", async () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    const file = new File(["test"], "test.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });

    (wrapper.vm as ImportVm).selectedFile = file;
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleImport();

    expect(importFileSpy).toHaveBeenCalledWith(file);
  });

  it("shows error toast when no URL is entered for file URL import", async () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    (wrapper.vm as ImportVm).fileUrl = "";
    await (wrapper.vm as ImportVm).handleFileUrlImport();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "error",
        title: "toolbox.import.errorMessages.noUrlEntered",
      }),
    );
  });

  it("calls importFileUrl when a URL is entered and import is triggered", async () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    (wrapper.vm as ImportVm).fileUrl = "https://example.com/data.kml";
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleFileUrlImport();

    expect(importFileUrlSpy).toHaveBeenCalledWith(
      "https://example.com/data.kml",
    );
  });

  it("shows success toast after successful file import", async () => {
    importFileSpy.mockResolvedValueOnce(undefined);
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    const file = new File(["test"], "test.kml");

    (wrapper.vm as ImportVm).selectedFile = file;
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleImport();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "success",
        title: "toolbox.import.successMessage",
      }),
    );
  });

  it("shows error toast when file import throws", async () => {
    importFileSpy.mockRejectedValueOnce(new Error("Import failed"));
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    const file = new File(["test"], "test.kml");

    (wrapper.vm as ImportVm).selectedFile = file;
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleImport();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "error",
        title: "Import failed",
      }),
    );
  });

  it("shows success toast after successful URL import", async () => {
    importFileUrlSpy.mockResolvedValueOnce(undefined);
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    (wrapper.vm as ImportVm).fileUrl = "https://example.com/data.kml";
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleFileUrlImport();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "success",
        title: "toolbox.import.successMessage",
      }),
    );
  });

  it("shows error toast when URL import throws", async () => {
    importFileUrlSpy.mockRejectedValueOnce(new Error("Fetch failed"));
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    (wrapper.vm as ImportVm).fileUrl = "https://example.com/data.kml";
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleFileUrlImport();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "error",
        title: "Fetch failed",
      }),
    );
  });

  it("clears fileUrl after successful URL import", async () => {
    importFileUrlSpy.mockResolvedValueOnce(undefined);
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    (wrapper.vm as ImportVm).fileUrl = "https://example.com/data.kml";
    await wrapper.vm.$nextTick();

    await (wrapper.vm as ImportVm).handleFileUrlImport();

    expect((wrapper.vm as ImportVm).fileUrl).toBe("");
  });
  it("imports legacy drawings through the legacy importer", async () => {
    drawingImport.url.value = "https://map.geo.admin.ch/#/map";
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    await (wrapper.vm as ImportVm).onImportDrawing();
    expect(drawingImport.importLegacyDrawing).toHaveBeenCalledOnce();
    expect(drawingImport.importSwissgeoDrawing).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "imports validated Swissgeo drawings with admin mode %s",
    async (asAdmin) => {
      drawingImport.url.value = "https://drawings.test/drawing#admin";
      drawingImport.swissGeoUrlValidation.value = {
        isValid: true,
        drawingId: "drawing",
        adminId: "admin",
        adminIdProvided: true,
      };
      const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
      await (wrapper.vm as ImportVm).onImportDrawing(asAdmin);
      expect(drawingImport.importSwissgeoDrawing).toHaveBeenCalledWith(asAdmin);
      expect(drawingImport.importLegacyDrawing).not.toHaveBeenCalled();
      expect(drawingImport.url.value).toBe("");
    },
  );

  it("falls back to a read-only import when admin auth is unavailable", async () => {
    drawingImport.swissGeoUrlValidation.value = {
      isValid: true,
      drawingId: "drawing",
      adminId: "",
      adminIdProvided: true,
    };
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    await (wrapper.vm as ImportVm).onImportDrawing(true);
    expect(drawingImport.importSwissgeoDrawing).toHaveBeenCalledWith(false);
  });

  it("shows an error toast and retains the URL when the import fails", async () => {
    drawingImport.url.value = "https://drawings.test/drawing";
    drawingImport.swissGeoUrlValidation.value = {
      isValid: true,
      drawingId: "drawing",
      adminId: "",
      adminIdProvided: false,
    };
    drawingImport.importSwissgeoDrawing.mockRejectedValueOnce(
      new Error("Offline"),
    );
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    await (wrapper.vm as ImportVm).onImportDrawing();
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: "error", title: "Offline" }),
    );
    expect(drawingImport.url.value).toBe("https://drawings.test/drawing");
  });
});
