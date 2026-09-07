import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ReportIssueEmail from "@/components/toolbox/reportIssue/ReportIssueEmail.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div>{{ label }}{{ help }}<slot /></div>",
    props: ["label", "name", "help"],
  },
  UInput: {
    name: "UInput",
    template: '<input class="input" />',
    props: ["modelValue", "placeholder", "ui"],
    emits: ["update:modelValue"],
  },
};

describe("ReportIssueEmail.vue", () => {
  it("renders the field label", () => {
    const wrapper = mount(ReportIssueEmail, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step4.title");
  });

  it("renders the help text", () => {
    const wrapper = mount(ReportIssueEmail, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step4.info");
  });

  it("passes modelValue to the input", () => {
    const wrapper = mount(ReportIssueEmail, {
      props: { modelValue: "test@example.com" },
      global: { stubs },
    });
    const input = wrapper.findComponent({ name: "UInput" });
    expect(input.props("modelValue")).toBe("test@example.com");
  });

  it("emits update:modelValue when input changes", async () => {
    const wrapper = mount(ReportIssueEmail, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    const input = wrapper.findComponent({ name: "UInput" });
    await input.vm.$emit("update:modelValue", "new@example.com");
    expect(wrapper.emitted("update:modelValue")).toEqual([["new@example.com"]]);
  });
});
