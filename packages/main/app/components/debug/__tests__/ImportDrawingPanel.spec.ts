import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import ImportDrawingPanel from "~/components/debug/ImportDrawingPanel.vue";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { importDrawingMock, urlRef } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    importDrawingMock: vi.fn(),
    urlRef: ref(""),
  };
});

mockNuxtImport("useI18n", () => () => ({
  t: (key: string) => key,
  te: () => true,
}));

vi.mock("~/composables/useImportDrawing", () => ({
  useImportDrawing: vi.fn(() => ({
    url: urlRef,
    isLoading: { value: false },
    errorMessage: { value: "" },
    successMessage: { value: "" },
    importDrawing: importDrawingMock,
  })),
}));

vi.mock("@swissgeo/skeleton", () => ({
  IconButton: { template: "<button><slot /></button>" },
}));

describe("ImportDrawingPanel.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlRef.value = "";
  });

  it("renders correctly", () => {
    const wrapper = shallowMount(ImportDrawingPanel);
    expect(wrapper.exists()).toBe(true);
  });

  it("calls importDrawing when import button is clicked", async () => {
    const wrapper = shallowMount(ImportDrawingPanel);
    const button = wrapper.find('[data-testid="drawing-import-button"]');
    await button.trigger("click");

    expect(importDrawingMock).toHaveBeenCalled();
  });

  it("emits close when close button is clicked", async () => {
    const wrapper = shallowMount(ImportDrawingPanel);
    const button = wrapper.find('[data-testid="drawing-import-close-button"]');
    await button.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
