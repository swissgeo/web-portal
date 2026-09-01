import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ReportIssueCategory from "@/components/toolbox/reportIssue/ReportIssueCategory.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div>{{ label }}<slot /></div>",
    props: ["label", "name", "required"],
  },
  USelect: {
    name: "USelect",
    template: '<select class="select" />',
    props: ["modelValue", "items", "placeholder", "ui"],
    emits: ["update:modelValue"],
  },
  UButton: {
    name: "UButton",
    template: '<a class="link" :href="to"><slot /></a>',
    props: ["to", "variant", "target"],
  },
};

describe("ReportIssueCategory.vue", () => {
  it("renders the field label", () => {
    const wrapper = mount(ReportIssueCategory, {
      props: { modelValue: "" },
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step1.title");
  });

  it("passes the correct items to the select", () => {
    const wrapper = mount(ReportIssueCategory, {
      props: { modelValue: "" },
      global: { stubs },
    });
    const select = wrapper.findComponent({ name: "USelect" });
    expect(select.props("items")).toHaveLength(4);
    expect(select.props("items")).toEqual([
      {
        label: "toolbox.reportIssue.steps.step1.select.options.background",
        value: "background",
      },
      {
        label: "toolbox.reportIssue.steps.step1.select.options.thematic",
        value: "thematic",
      },
      {
        label: "toolbox.reportIssue.steps.step1.select.options.application",
        value: "application",
      },
      {
        label: "toolbox.reportIssue.steps.step1.select.options.other",
        value: "other",
      },
    ]);
  });

  it("emits update:modelValue when select changes", async () => {
    const wrapper = mount(ReportIssueCategory, {
      props: { modelValue: "" },
      global: { stubs },
    });
    const select = wrapper.findComponent({ name: "USelect" });
    await select.vm.$emit("update:modelValue", "thematic");
    expect(wrapper.emitted("update:modelValue")).toEqual([["thematic"]]);
  });

  it("renders the more info link", () => {
    const wrapper = mount(ReportIssueCategory, {
      props: { modelValue: "" },
      global: { stubs },
    });
    const link = wrapper.find(".link");
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe("toolbox.reportIssue.steps.step1.moreInfo.label");
  });
});
