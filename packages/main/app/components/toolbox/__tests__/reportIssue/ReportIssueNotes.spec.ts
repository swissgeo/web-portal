import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ReportIssueNotes from "@/components/toolbox/reportIssue/ReportIssueNotes.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UButton: {
    name: "UButton",
    template: '<a class="link" :href="to" :target="target"><slot /></a>',
    props: ["to", "variant", "target"],
  },
};

describe("ReportIssueNotes.vue", () => {
  it("renders the permalink with correct href", () => {
    const wrapper = mount(ReportIssueNotes, {
      props: { permalink: "https://map.geo.admin.ch/?state=abc" },
      global: { stubs },
    });
    const links = wrapper.findAll(".link");
    expect(links).toHaveLength(2);
    expect(links[0]!.attributes("href")).toBe(
      "https://map.geo.admin.ch/?state=abc",
    );
  });

  it("renders the permalink text", () => {
    const wrapper = mount(ReportIssueNotes, {
      props: { permalink: "https://example.com" },
      global: { stubs },
    });
    expect(wrapper.text()).toContain(
      "toolbox.reportIssue.notes.link.permalink",
    );
  });

  it("renders the TOS link with correct URL", () => {
    const wrapper = mount(ReportIssueNotes, {
      props: { permalink: "https://example.com" },
      global: { stubs },
    });
    const links = wrapper.findAll(".link");
    expect(links).toHaveLength(2);
    expect(links[1]!.attributes("href")).toBe(
      "toolbox.reportIssue.notes.tos.url",
    );
  });

  it("both links open in a new tab", () => {
    const wrapper = mount(ReportIssueNotes, {
      props: { permalink: "https://example.com" },
      global: { stubs },
    });
    const links = wrapper.findAll(".link");
    expect(links).toHaveLength(2);
    expect(links[0]!.attributes("target")).toBe("_blank");
    expect(links[1]!.attributes("target")).toBe("_blank");
  });
});
