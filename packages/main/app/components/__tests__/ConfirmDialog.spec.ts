import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ConfirmDialog from "@/components/ConfirmDialog.vue";

const UModalStub = {
  name: "UModal",
  props: ["open", "title", "description"],
  emits: ["update:open"],
  template: `<div data-testid="umodal-stub">
    <span data-testid="umodal-title">{{ title }}</span>
    <span data-testid="umodal-description">{{ description }}</span>
    <slot name="body" />
    <slot name="footer" />
  </div>`,
};

const UButtonStub = {
  name: "UButton",
  inheritAttrs: false,
  props: ["label"],
  template: '<button v-bind="$attrs">{{ label }}</button>',
};

function mountConfirmDialog(props: { note?: string } = {}) {
  return mount(ConfirmDialog, {
    props: {
      open: true,
      title: "Replace current drawing?",
      description: "Warning: this will erase your current drawing layer.",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      ...props,
    },
    global: {
      stubs: { UModal: UModalStub, UButton: UButtonStub },
    },
  });
}

describe("ConfirmDialog.vue", () => {
  it("passes title and description to the modal", () => {
    const wrapper = mountConfirmDialog();

    expect(wrapper.get('[data-testid="umodal-title"]').text()).toBe(
      "Replace current drawing?",
    );
    expect(wrapper.get('[data-testid="umodal-description"]').text()).toBe(
      "Warning: this will erase your current drawing layer.",
    );
  });

  it("renders the note only when provided", () => {
    const withNote = mountConfirmDialog({ note: "temporary limitation" });
    expect(withNote.get('[data-testid="confirm-dialog-note"]').text()).toBe(
      "temporary limitation",
    );

    const withoutNote = mountConfirmDialog();
    expect(
      withoutNote.find('[data-testid="confirm-dialog-note"]').exists(),
    ).toBe(false);
  });

  it("emits confirm when the confirm button is clicked, without closing itself", async () => {
    const wrapper = mountConfirmDialog();

    await wrapper
      .get('[data-testid="confirm-dialog-confirm"]')
      .trigger("click");

    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("cancel")).toBeUndefined();
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });

  it("emits cancel when the cancel button is clicked, without closing itself", async () => {
    const wrapper = mountConfirmDialog();

    await wrapper.get('[data-testid="confirm-dialog-cancel"]').trigger("click");

    expect(wrapper.emitted("cancel")).toHaveLength(1);
    expect(wrapper.emitted("confirm")).toBeUndefined();
    expect(wrapper.emitted("update:open")).toBeUndefined();
  });

  it("treats a modal dismissal (ESC, overlay, close button) as cancel", async () => {
    const wrapper = mountConfirmDialog();

    wrapper.findComponent({ name: "UModal" }).vm.$emit("update:open", false);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("cancel")).toHaveLength(1);
    expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
  });

  it("styles the confirm action as destructive", () => {
    const wrapper = mountConfirmDialog();

    expect(
      wrapper.get('[data-testid="confirm-dialog-confirm"]').attributes("color"),
    ).toBe("error");
    expect(
      wrapper.get('[data-testid="confirm-dialog-cancel"]').attributes("color"),
    ).toBe("neutral");
  });
});
