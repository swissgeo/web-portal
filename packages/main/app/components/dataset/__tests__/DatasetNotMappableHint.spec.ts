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

function mountHint(isMappable: boolean) {
  return mount(DatasetNotMappableHint, {
    props: { isMappable },
    slots: { default: "<span>control</span>" },
    global: { stubs: { UPopover } },
  });
}

describe("DatasetNotMappableHint.vue", () => {
  it("opens on hover and tap above the control", () => {
    const popover = mountHint(false).getComponent({ name: "UPopover" });

    expect(popover.props("mode")).toBe("hover");
    expect(popover.props("enableTouch")).toBe(true);
    expect(popover.props("content")).toMatchObject({ side: "top" });
  });

  it.each`
    isMappable | isShown
    ${false}   | ${true}
    ${true}    | ${false}
  `(
    "shows the hint=$isShown on focus when isMappable=$isMappable",
    async ({ isMappable, isShown }) => {
      const wrapper = mountHint(isMappable);
      const hint = () => wrapper.find("[data-testid='not-mappable-hint']");

      await wrapper.get("[data-testid='trigger']").trigger("focus");

      expect(hint().exists()).toBe(isShown);
      if (isShown) {
        expect(hint().text()).toBe("dataset.notMappable");
      }

      await wrapper.get("[data-testid='trigger']").trigger("blur");

      expect(hint().exists()).toBe(false);
    },
  );
});
