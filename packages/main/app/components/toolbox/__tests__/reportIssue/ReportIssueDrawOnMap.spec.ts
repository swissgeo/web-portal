import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ReportIssueDrawOnMap from "@/components/toolbox/reportIssue/ReportIssueDrawOnMap.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div>{{ label }}<slot /></div>",
    props: ["label", "name"],
  },
  UButton: {
    name: "UButton",
    template: '<button class="btn" :disabled="disabled"><slot /></button>',
    props: ["disabled"],
  },
};

describe("ReportIssueDrawOnMap.vue", () => {
  it("renders the field label", () => {
    const wrapper = mount(ReportIssueDrawOnMap, {
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step3.title");
  });

  it("renders a disabled button", () => {
    const wrapper = mount(ReportIssueDrawOnMap, {
      global: { stubs },
    });
    const button = wrapper.find(".btn");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("renders the button text", () => {
    const wrapper = mount(ReportIssueDrawOnMap, {
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step3.button");
  });
});
