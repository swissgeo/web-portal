import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import NaturalLanguageMapSearch from "~/components/NaturalLanguageMapSearch.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const { loadModel, modelLoadState, run, status, suggestions } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    return {
      loadModel: vi.fn(),
      modelLoadState: ref<"error" | "idle" | "loading" | "ready">("idle"),
      run: vi.fn(),
      status: ref(""),
      suggestions: ref([]),
    };
  });

mockNuxtImport("useI18n", () => {
  return () => ({ locale: ref("en") });
});

mockNuxtImport("useNaturalLanguageMapSearch", () => {
  return () => ({
    chooseLayer: vi.fn(),
    isRunning: ref(false),
    loadModel,
    modelLoadState,
    run,
    status,
    suggestions,
  });
});

const UButtonStub = {
  props: {
    disabled: Boolean,
    loading: Boolean,
    type: String,
  },
  emits: ["click"],
  template:
    '<button :type="type" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
};

const UInputStub = {
  props: {
    disabled: Boolean,
    modelValue: String,
  },
  emits: ["update:modelValue"],
  template: '<input :disabled="disabled" />',
};

function mountComponent() {
  return mount(NaturalLanguageMapSearch, {
    global: { stubs: { UButton: UButtonStub, UInput: UInputStub } },
  });
}

describe("NaturalLanguageMapSearch", () => {
  beforeEach(() => {
    modelLoadState.value = "idle";
    status.value = "";
    vi.clearAllMocks();
  });

  it("keeps search disabled until the user loads the model", async () => {
    const wrapper = mountComponent();

    expect(wrapper.get("input").attributes("disabled")).toBeDefined();
    expect(
      wrapper
        .get('[data-testid="natural-language-map-search-submit"]')
        .attributes("disabled"),
    ).toBeDefined();

    await wrapper
      .get('[data-testid="natural-language-map-search-load-model"]')
      .trigger("click");

    expect(loadModel).toHaveBeenCalledOnce();
  });

  it("unlocks the query input only after the model is ready", async () => {
    const wrapper = mountComponent();

    modelLoadState.value = "ready";
    await wrapper.vm.$nextTick();

    expect(wrapper.get("input").attributes("disabled")).toBeUndefined();
    expect(wrapper.text()).toContain("Model ready");
  });

  it("allows retry after a model loading error", async () => {
    modelLoadState.value = "error";
    status.value = "Model download failed";
    const wrapper = mountComponent();

    expect(wrapper.get('[role="alert"]').text()).toBe("Model download failed");

    await wrapper
      .get('[data-testid="natural-language-map-search-load-model"]')
      .trigger("click");

    expect(loadModel).toHaveBeenCalledOnce();
  });
});
