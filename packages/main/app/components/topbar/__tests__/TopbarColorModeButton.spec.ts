import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import TopbarColorModeButton from "~/components/topbar/TopbarColorModeButton.vue";
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: (key: string) => (key === "topbar.modeSwitch" ? "Mode switch" : key),
  });
});

const UColorModeButtonStub = defineComponent({
  name: "UColorModeButton",
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      required: true,
    },
  },
  template: '<button v-bind="$attrs">{{ label }}</button>',
});

describe("TopbarColorModeButton", () => {
  it("uses the Nuxt UI color-mode control with a visible label", () => {
    const wrapper = mount(TopbarColorModeButton, {
      global: {
        stubs: {
          UColorModeButton: UColorModeButtonStub,
        },
      },
    });

    expect(wrapper.get("button").text()).toBe("Mode switch");
  });
});
