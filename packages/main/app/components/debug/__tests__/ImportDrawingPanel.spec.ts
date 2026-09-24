import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import ImportDrawingPanel from "~/components/debug/ImportDrawingPanel.vue";
import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  importDrawingMock,
  urlRef,
  isLoadingRef,
  errorMessageRef,
  successMessageRef,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    importDrawingMock: vi.fn(),
    urlRef: ref(""),
    isLoadingRef: ref(false),
    errorMessageRef: ref(""),
    successMessageRef: ref(""),
  };
});

mockNuxtImport("useI18n", () => () => ({
  t: (key: string) => key,
  te: () => true,
}));

vi.mock("~/composables/useImportDrawing", () => ({
  useImportDrawing: vi.fn(() => ({
    url: urlRef,
    isLoading: isLoadingRef,
    errorMessage: errorMessageRef,
    successMessage: successMessageRef,
    importDrawing: importDrawingMock,
  })),
}));

function mountPanel() {
  return shallowMount(ImportDrawingPanel, {
    global: {
      stubs: {
        UButton: {
          inheritAttrs: false,
          template: "<button v-bind='$attrs'><slot /></button>",
        },
      },
    },
  });
}

describe("ImportDrawingPanel.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlRef.value = "";
    isLoadingRef.value = false;
    errorMessageRef.value = "";
    successMessageRef.value = "";
  });

  it("renders correctly", () => {
    const wrapper = mountPanel();
    expect(wrapper.exists()).toBe(true);
  });

  it("calls importDrawing when import button is clicked", async () => {
    const wrapper = mountPanel();
    await wrapper
      .get('[data-testid="drawing-url-input"]')
      .setValue("https://s.geo.admin.ch/example");
    const button = wrapper.find('[data-testid="drawing-import-button"]');
    expect(button.attributes("disabled")).toBeUndefined();
    await button.trigger("click");

    expect(importDrawingMock).toHaveBeenCalled();
  });

  it("emits close when close button is clicked", async () => {
    const wrapper = mountPanel();
    const button = wrapper.find('[data-testid="drawing-import-close-button"]');
    await button.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
