import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const UButtonStub = {
  inheritAttrs: false,
  props: ["disabled"],
  template: "<button v-bind='$attrs' :disabled='disabled'><slot /></button>",
};

function mountButton(props: { isActive?: boolean; isDisabled?: boolean }) {
  return mount(ToolBoxButton, {
    props: {
      title: "Zeichnen",
      iconName: "pencil",
      isActive: false,
      isDisabled: false,
      ...props,
    },
    global: { stubs: { UButton: UButtonStub, UIcon: true } },
  });
}

describe("ToolBoxButton.vue", () => {
  // The Figma dark mode design uses dark gray, not blue, for the active button.
  it.each`
    isActive | hasDarkGray
    ${true}  | ${true}
    ${false} | ${false}
  `(
    "uses the dark gray active background: $hasDarkGray when isActive is $isActive",
    ({ isActive, hasDarkGray }) => {
      const classes = mountButton({ isActive }).get("button").classes();
      expect(classes.includes("dark:bg-(--ui-color-accent-700)")).toBe(
        hasDarkGray,
      );
      expect(classes.includes("dark:text-accent-active")).toBe(hasDarkGray);
    },
  );
});
