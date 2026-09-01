import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ReportIssueAttachment from "@/components/toolbox/reportIssue/ReportIssueAttachment.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div>{{ label }}<slot /></div>",
    props: ["label", "name"],
  },
  UFileUpload: {
    name: "UFileUpload",
    template: '<div class="file-upload" />',
    props: ["modelValue", "label", "description", "accept"],
    emits: ["update:modelValue"],
  },
};

describe("ReportIssueAttachment.vue", () => {
  it("renders the field label", () => {
    const wrapper = mount(ReportIssueAttachment, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    expect(wrapper.text()).toContain("toolbox.reportIssue.steps.step5.title");
  });

  it("passes the correct accept prop with all MIME types", () => {
    const wrapper = mount(ReportIssueAttachment, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    const fileUpload = wrapper.findComponent({ name: "UFileUpload" });
    const accept = fileUpload.props("accept");
    expect(accept).toContain("application/pdf");
    expect(accept).toContain("application/zip");
    expect(accept).toContain("image/jpeg");
    expect(accept).toContain("image/png");
    expect(accept).toContain("application/vnd.google-earth.kml+xml");
    expect(accept).toContain("application/vnd.google-earth.kmz");
    expect(accept).toContain("application/gpx+xml");
  });

  it("passes human-readable file type labels as description", () => {
    const wrapper = mount(ReportIssueAttachment, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    const fileUpload = wrapper.findComponent({ name: "UFileUpload" });
    const description = fileUpload.props("description");
    expect(description).toContain("PDF");
    expect(description).toContain("ZIP");
    expect(description).toContain("JPG");
    expect(description).toContain("PNG");
    expect(description).toContain("KML");
    expect(description).toContain("KMZ");
    expect(description).toContain("GPX");
  });

  it("emits update:modelValue when file is selected", async () => {
    const wrapper = mount(ReportIssueAttachment, {
      props: { modelValue: undefined },
      global: { stubs },
    });
    const fileUpload = wrapper.findComponent({ name: "UFileUpload" });
    const file = new File(["test"], "test.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });
    await fileUpload.vm.$emit("update:modelValue", file);
    expect(wrapper.emitted("update:modelValue")).toEqual([[file]]);
  });
});
