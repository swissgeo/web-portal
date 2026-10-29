import type { AttributionSource } from "~/composables/useAttributionSources";

import { mount } from "@vue/test-utils";
import AttributionList from "~/components/map/attribution/AttributionList.vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("AttributionList.vue", () => {
  it("renders provided sources", () => {
    const sources: AttributionSource[] = [
      {
        abbreviation: "Source A",
        name: "Source A full name",
        url: "https://example.com/a",
      },
      { abbreviation: "Source B", name: "Source B full name" },
    ];

    const wrapper = mount(AttributionList, { props: { sources } });

    expect(wrapper.find('[data-testid="layers-copyrights"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="layer-copyright-Source A"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="layer-copyright-Source B"]').exists(),
    ).toBe(true);
  });

  it("shows the abbreviation as label and the name as tooltip", () => {
    const sources: AttributionSource[] = [
      {
        abbreviation: "FOEN",
        name: "Federal Office for the Environment FOEN",
        url: "https://example.com/foen",
      },
      { abbreviation: "Army", name: "Swiss Armed Forces" },
    ];

    const wrapper = mount(AttributionList, { props: { sources } });

    const link = wrapper.find('[data-testid="layer-copyright-FOEN"]');
    expect(link.element.tagName).toBe("A");
    expect(link.text()).toBe("FOEN");
    expect(link.attributes("title")).toBe(
      "Federal Office for the Environment FOEN",
    );
    expect(
      wrapper.find('[data-testid="layer-copyright-Army"]').attributes("title"),
    ).toBe("Swiss Armed Forces");
  });

  it("renders nothing when sources is empty", () => {
    const wrapper = mount(AttributionList, { props: { sources: [] } });

    expect(wrapper.find('[data-testid="layers-copyrights"]').exists()).toBe(
      false,
    );
  });

  it("separates the sources with a comma and a space outside the links", () => {
    const sources: AttributionSource[] = [
      {
        abbreviation: "Source A",
        name: "Source A full name",
        url: "https://example.com/a",
      },
      { abbreviation: "Source B", name: "Source B full name" },
    ];

    const wrapper = mount(AttributionList, { props: { sources } });

    const items = wrapper.findAll('[data-testid^="layer-copyright-"]');
    expect(items[0]!.text()).toBe("Source A");
    expect(items[1]!.text()).toBe("Source B");
    expect(
      wrapper
        .find('[data-testid="layers-copyrights"]')
        .element.textContent?.endsWith("Source A, Source B"),
    ).toBe(true);
  });
});
