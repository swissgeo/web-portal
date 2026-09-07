import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ReportIssueFeedback from "@/components/toolbox/reportIssue/ReportIssueFeedback.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div>{{ label }}<slot /></div>",
    props: ["label", "name", "required"],
  },
  UTextarea: {
    name: "UTextarea",
    template: '<textarea class="textarea" />',
    props: ["modelValue", "ui"],
    emits: ["update:modelValue"],
  },
};

describe("ReportIssueFeedback.vue", () => {
  it("renders the field label", () => {
    const wrapper = mount(ReportIssueFeedback, {
      props: { modelValue: "" },
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step2.title");
  });

  it("passes modelValue to the textarea", () => {
    const wrapper = mount(ReportIssueFeedback, {
      props: { modelValue: "test feedback" },
      global: { stubs },
    });
    const textarea = wrapper.findComponent({ name: "UTextarea" });
    expect(textarea.props("modelValue")).toBe("test feedback");
  });

  it("emits update:modelValue when textarea changes", async () => {
    const wrapper = mount(ReportIssueFeedback, {
      props: { modelValue: "" },
      global: { stubs },
    });
    const textarea = wrapper.findComponent({ name: "UTextarea" });
    await textarea.vm.$emit("update:modelValue", "new feedback");
    expect(wrapper.emitted("update:modelValue")).toEqual([["new feedback"]]);
  });
});
