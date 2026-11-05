import type { Legend } from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import LayerLegend from "@/components/sidebar/LayerLegend.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  ULink: {
    props: ["to"],
    template: "<a v-if='to' :href='to'><slot /></a><div v-else><slot /></div>",
  },
  UIcon: { template: "<span />" },
  UModal: { template: "<div><slot /></div>" },
};

function mountLegend(legends: Legend[], detailLink?: string) {
  return mount(LayerLegend, {
    props: { legends, detailLink },
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
    expect(wrapper.text()).toContain("layers.legend.openPdf");
  });

  it("labels legends by type", () => {
    const wrapper = mountLegend([
      { href: "https://example.com/legend", format: "text/html" },
      { href: "https://example.com/legend.zip", format: "application/zip" },
    ]);

    expect(wrapper.text()).toContain("layers.legend.openPage");
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

  it("links to the legend when the image fails to load", async () => {
    const wrapper = mountLegend([
      { href: "https://example.com/legend.png", format: "image/png" },
    ]);

    await wrapper.find("img").trigger("error");

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find("a").attributes("href")).toBe(
      "https://example.com/legend.png",
    );
    expect(wrapper.text()).not.toContain("layers.legend.notAvailable");
  });

  it("opens the legend tab of the dataset when the user clicks the legend", () => {
    const wrapper = mountLegend(
      [{ href: "https://example.com/legend.png", format: "image/png" }],
      "/de/dataset/a-dataset?tab=legend",
    );

    const link = wrapper.get("[data-testid='layer-legend-images']");
    expect(link.attributes("href")).toBe("/de/dataset/a-dataset?tab=legend");
    expect(link.find("img").attributes("src")).toBe(
      "https://example.com/legend.png",
    );
  });

  it("keeps document legends outside the link to the dataset", () => {
    const wrapper = mountLegend(
      [
        { href: "https://example.com/legend.png", format: "image/png" },
        { href: "https://example.com/legend.pdf", format: "application/pdf" },
      ],
      "/de/dataset/a-dataset?tab=legend",
    );

    const link = wrapper.get("[data-testid='layer-legend-images']");
    expect(link.text()).not.toContain("layers.legend.openPdf");
    expect(wrapper.text()).toContain("layers.legend.openPdf");
  });

  it("shows the legend without a link when there is no dataset to open", () => {
    const wrapper = mountLegend([
      { href: "https://example.com/legend.png", format: "image/png" },
    ]);

    expect(
      wrapper.get("[data-testid='layer-legend-images']").element.tagName,
    ).toBe("DIV");
  });
});
