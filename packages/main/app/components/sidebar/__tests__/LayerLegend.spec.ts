import type { Legend } from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import LayerLegend from "@/components/sidebar/LayerLegend.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  ULink: { template: "<a :href='to'><slot /></a>", props: ["to"] },
  UIcon: { template: "<span />" },
};

function mountLegend(legends: Legend[]) {
  return mount(LayerLegend, {
    props: { legends },
    global: { stubs },
  });
}

describe("LayerLegend.vue", () => {
  it("displays image legends inline", () => {
    const wrapper = mountLegend([
      { href: "https://example.com/legend.png", format: "image/png" },
    ]);

    expect(wrapper.find("img").attributes("src")).toBe(
      "https://example.com/legend.png",
    );
    expect(wrapper.text()).not.toContain("layers.legend.notAvailable");
  });

  it("links to legends that cannot be displayed inline", () => {
    const wrapper = mountLegend([
      { href: "https://example.com/legend.pdf", format: "application/pdf" },
    ]);

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find("a").attributes("href")).toBe(
      "https://example.com/legend.pdf",
    );
    expect(wrapper.text()).toContain("layers.legend.openDocument");
  });

  it("falls back on the file extension when no format is advertised", () => {
    const wrapper = mountLegend([{ href: "https://example.com/legend.pdf" }]);

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find("a").exists()).toBe(true);
  });

  it("tells the user when there is no legend", () => {
    const wrapper = mountLegend([]);

    expect(wrapper.text()).toContain("layers.legend.notAvailable");
  });

  it("tells the user when the legend image fails to load", async () => {
    const wrapper = mountLegend([
      { href: "https://example.com/legend.png", format: "image/png" },
    ]);

    await wrapper.find("img").trigger("error");

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("layers.legend.notAvailable");
  });
});
