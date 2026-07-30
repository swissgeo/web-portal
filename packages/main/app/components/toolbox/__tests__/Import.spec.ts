import type { ComponentPublicInstance } from "vue";

import { shallowMount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

import Import from "@/components/toolbox/import/Import.vue";
import { useFileImport } from "@/composables/useFileImport";

type ImportVm = ComponentPublicInstance & {
  handleImport: () => Promise<void>;
};

const importFileSpy = vi.fn();
vi.mock("@/composables/useFileImport", () => ({
  useFileImport: vi.fn(() => ({
    importFile: importFileSpy,
  })),
}));

vi.mock("@swissgeo/skeleton", () => ({
  IconButton: { template: "<button><slot /></button>" },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("~/stores/toolbox", () => ({
  useToolboxStore: vi.fn(() => ({
    closeDetailPanel: vi.fn(),
  })),
}));

const globalStubs = {
  UCard: { template: "<div><slot /></div>" },
  UButton: { template: "<button><slot /></button>" },
};

describe("Import.vue", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows error message when no file is selected", async () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });

    // call import handler directly to avoid relying on unresolved Button component
    await (wrapper.vm as ImportVm).handleImport();
    expect(wrapper.text()).toContain("toolbox.import.browseButton");
  });

  it("calls importFile when a file is selected and import is triggered", async () => {
    const wrapper = shallowMount(Import, { global: { stubs: globalStubs } });
    const file = new File(["test"], "test.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });

    const inputWrapper = wrapper.find('input[type="file"]');
    const inputEl = inputWrapper.element as HTMLInputElement;
    // define files property on the input element
    Object.defineProperty(inputEl, "files", { value: [file] });
    await inputWrapper.trigger("change");

    // call import handler directly
    await (wrapper.vm as ImportVm).handleImport();

    const { importFile } = useFileImport();
    expect(importFile).toHaveBeenCalledWith(file);
  });
});
