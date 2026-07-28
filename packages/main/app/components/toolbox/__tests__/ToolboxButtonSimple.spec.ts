import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DrawButton from "@/components/toolbox/toolboxButtons/DrawButton.vue";
import MeasureButton from "@/components/toolbox/toolboxButtons/MeasureButton.vue";
import PrintButton from "@/components/toolbox/toolboxButtons/PrintButton.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const ToolBoxButtonStub = {
  template:
    '<button data-testid="tool-box-btn"><span class="title">{{ title }}</span><span class="active">{{ isActive }}</span><span class="disabled">{{ isDisabled }}</span></button>',
  props: ["title", "isActive", "isDisabled", "iconName"],
};

describe.each([
  {
    name: "DrawButton",
    component: DrawButton,
    titleKey: "toolbox.drawing.buttonTitle",
  },
  {
    name: "MeasureButton",
    component: MeasureButton,
    titleKey: "toolbox.measure.buttonTitle",
  },
  {
    name: "PrintButton",
    component: PrintButton,
    titleKey: "toolbox.print.buttonTitle",
  },
])("$name", ({ component, titleKey }) => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mountButton() {
    return mount(component, {
      shallow: true,
      global: {
        stubs: {
          ToolBoxButton: ToolBoxButtonStub,
        },
      },
    });
  }

  it("renders with the correct title", () => {
    const wrapper = mountButton();
    expect(wrapper.find(".title").text()).toBe(titleKey);
  });

  it("is not disabled", () => {
    const wrapper = mountButton();
    expect(wrapper.find(".disabled").text()).toBe("false");
  });

  it("is not active", () => {
    const wrapper = mountButton();
    expect(wrapper.find(".active").text()).toBe("false");
  });
});
