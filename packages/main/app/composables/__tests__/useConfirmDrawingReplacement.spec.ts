import { mount } from "@vue/test-utils";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { useConfirmDrawingReplacement } from "@/composables/useConfirmDrawingReplacement";

const { isDrawingLayerInLayerStore } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDrawingLayerInLayerStore: ref(false) };
});

vi.mock("@swissgeo/drawing", () => ({
  useDrawing: vi.fn(() => ({ isDrawingLayerInLayerStore })),
}));

type Guard = ReturnType<typeof useConfirmDrawingReplacement>;

let guard: Guard;

const GuardHost = defineComponent({
  setup() {
    guard = useConfirmDrawingReplacement();
    return {};
  },
  template: "<div />",
});

describe("useConfirmDrawingReplacement", () => {
  beforeEach(() => {
    isDrawingLayerInLayerStore.value = false;
  });

  it("resolves immediately without a prompt when no drawing layer exists", async () => {
    const wrapper = mount(GuardHost);

    await expect(
      guard.confirmReplaceDrawing({ noteVariant: "temporary" }),
    ).resolves.toBe(true);
    expect(guard.isConfirmModalOpen.value).toBe(false);
    expect(guard.noteVariant.value).toBe("temporary");

    wrapper.unmount();
  });

  it("opens the confirm modal and resolves true on confirmation", async () => {
    isDrawingLayerInLayerStore.value = true;
    const wrapper = mount(GuardHost);

    const promise = guard.confirmReplaceDrawing({ noteVariant: "adminSync" });
    expect(guard.isConfirmModalOpen.value).toBe(true);
    expect(guard.noteVariant.value).toBe("adminSync");

    guard.resolveConfirm(true);
    await expect(promise).resolves.toBe(true);
    expect(guard.isConfirmModalOpen.value).toBe(false);

    wrapper.unmount();
  });

  it("resolves false when the user cancels", async () => {
    isDrawingLayerInLayerStore.value = true;
    const wrapper = mount(GuardHost);

    const promise = guard.confirmReplaceDrawing({ noteVariant: "temporary" });
    guard.resolveConfirm(false);

    await expect(promise).resolves.toBe(false);
    expect(guard.isConfirmModalOpen.value).toBe(false);

    wrapper.unmount();
  });

  it("ignores repeated resolveConfirm calls", async () => {
    isDrawingLayerInLayerStore.value = true;
    const wrapper = mount(GuardHost);

    const promise = guard.confirmReplaceDrawing({ noteVariant: "temporary" });
    guard.resolveConfirm(true);
    guard.resolveConfirm(false);

    await expect(promise).resolves.toBe(true);
    expect(guard.isConfirmModalOpen.value).toBe(false);

    wrapper.unmount();
  });

  it("resolves as cancelled when the scope is disposed while the modal is open", async () => {
    isDrawingLayerInLayerStore.value = true;
    const wrapper = mount(GuardHost);

    const promise = guard.confirmReplaceDrawing({ noteVariant: "temporary" });
    expect(guard.isConfirmModalOpen.value).toBe(true);

    wrapper.unmount();

    await expect(promise).resolves.toBe(false);
    expect(guard.isConfirmModalOpen.value).toBe(false);
  });
});
