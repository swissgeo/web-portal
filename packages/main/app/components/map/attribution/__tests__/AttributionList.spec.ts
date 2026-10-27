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
      { id: "source-a", name: "Source A", url: "https://example.com/a" },
      { id: "source-b", name: "Source B" },
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

  it("renders nothing when sources is empty", () => {
    const wrapper = mount(AttributionList, { props: { sources: [] } });

    expect(wrapper.find('[data-testid="layers-copyrights"]').exists()).toBe(
      false,
    );
  });

  it("separates the sources with a comma and a space outside the links", () => {
    const sources: AttributionSource[] = [
      { id: "source-a", name: "Source A", url: "https://example.com/a" },
      { id: "source-b", name: "Source B" },
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
