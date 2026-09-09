import type { ComponentPublicInstance } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

import Import from "@/components/toolbox/import/Import.vue";

type ImportVm = ComponentPublicInstance & {
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

vi.mock("@/composables/useImportDrawing", () => ({
  useImportDrawing: vi.fn(() => ({
    url: { value: "" },
    isLoading: { value: false },
    errorMessage: { value: "" },
    successMessage: { value: "" },
    importDrawing: vi.fn(),
  })),
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
mockNuxtImport("useToast", () => () => ({ add: toastAdd }));

const globalStubs = {
  UCard: { template: "<div><slot /></div>" },
  UButton: { template: "<button><slot /></button>" },
  UFileUpload: { template: "<div><slot /></div>" },
  UInput: { template: "<input />" },
  UTabs: { template: "<div><slot /></div>" },
};

describe("Import.vue", () => {
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
});
