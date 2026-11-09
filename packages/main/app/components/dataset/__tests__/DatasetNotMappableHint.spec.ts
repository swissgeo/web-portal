import { mount } from "@vue/test-utils";
import DatasetNotMappableHint from "~/components/dataset/DatasetNotMappableHint.vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// The popover asks to open on hover, tap and focus of the trigger
const UPopover = {
  name: "UPopover",
  props: {
    open: Boolean,
    mode: String,
    enableTouch: Boolean,
    content: Object,
  },
  emits: ["update:open"],
  template: `<div>
    <button data-testid="trigger" @focus="$emit('update:open', true)" @blur="$emit('update:open', false)"><slot /></button>
    <slot v-if="open" name="content" />
  </div>`,
};
const UTooltip = {
  name: "UTooltip",
  props: ["text", "content"],
  template: "<slot />",
};

function mountHint(showHint: boolean, tooltip?: string) {
  return mount(DatasetNotMappableHint, {
    props: { showHint, tooltip },
    slots: { default: "<span data-testid='control'>control</span>" },
    global: { stubs: { UPopover, UTooltip } },
  });
}

describe("DatasetNotMappableHint.vue", () => {
  it("opens on hover and tap above the control", () => {
    const popover = mountHint(true).getComponent({ name: "UPopover" });

    expect(popover.props("mode")).toBe("hover");
    expect(popover.props("enableTouch")).toBe(true);
    expect(popover.props("content")).toMatchObject({ side: "top" });
  });

  it("shows the hint on focus and hides it on blur", async () => {
    const wrapper = mountHint(true);
    const hint = () => wrapper.find("[data-testid='not-mappable-hint']");

    await wrapper.get("[data-testid='trigger']").trigger("focus");

    expect(hint().text()).toBe("dataset.notMappable");

    await wrapper.get("[data-testid='trigger']").trigger("blur");

    expect(hint().exists()).toBe(false);
  });

  it.each`
    showHint | tooltip               | hasPopover | hasTooltip
    ${true}  | ${"dataset.addToMap"} | ${true}    | ${false}
    ${false} | ${"dataset.addToMap"} | ${false}   | ${true}
    ${false} | ${undefined}          | ${false}   | ${false}
  `(
    "shows only one overlay with showHint=$showHint and tooltip=$tooltip",
    ({ showHint, tooltip, hasPopover, hasTooltip }) => {
      const wrapper = mountHint(showHint, tooltip);

      expect(wrapper.findComponent({ name: "UPopover" }).exists()).toBe(
        hasPopover,
      );
      expect(wrapper.findComponent({ name: "UTooltip" }).exists()).toBe(
        hasTooltip,
      );
      expect(wrapper.find("[data-testid='control']").exists()).toBe(true);
    },
  );

  // The tooltip takes its position from the app default (app.vue)
  it("shows the tooltip text without an own position", () => {
    const tooltip = mountHint(false, "dataset.addToMap").getComponent({
      name: "UTooltip",
    });

    expect(tooltip.props("text")).toBe("dataset.addToMap");
    expect(tooltip.props("content")).toBeUndefined();
  });
});
