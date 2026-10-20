import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import DatasetDescription from "../DatasetDescription.vue";

const isDesktop = ref(true);
mockNuxtImport("useIsDesktop", () => () => isDesktop);
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

function render(description: string) {
  return mount(DatasetDescription, {
    props: { description },
    global: {
      stubs: {
        ClientOnly: { template: "<slot />" },
        UButton: {
          props: ["label"],
          emits: ["click"],
          template: "<button @click=\"$emit('click')\">{{ label }}</button>",
        },
      },
    },
  });
}

describe("DatasetDescription", () => {
  beforeEach(() => {
    isDesktop.value = true;
  });

  // Real OAR text, ch.swisstopo.geologie-geomol_hoehe_top_lias (dev, 2026-10-19).
  it("renders the escaped HTML of the record as links and keeps bare URLs", () => {
    const wrapper = render(
      'at &lt;a href="https://viewer.swissgeol.ch"&gt;viewer.swissgeol.ch&lt;/a&gt;, see &lt;https://e.test/a?b=1&gt;',
    );
    const text = wrapper.get('[data-testid="dataset-description"]');

    expect(text.get("a").attributes("href")).toBe(
      "https://viewer.swissgeol.ch",
    );
    expect(text.text()).toBe(
      "at viewer.swissgeol.ch, see https://e.test/a?b=1",
    );
  });

  it("removes unsafe markup", () => {
    const wrapper = render("Text &lt;script&gt;alert(1)&lt;/script&gt;");

    expect(
      wrapper.get('[data-testid="dataset-description"]').html(),
    ).not.toContain("<script");
  });

  it.each`
    viewport     | desktop  | limit
    ${"desktop"} | ${true}  | ${1500}
    ${"mobile"}  | ${false} | ${400}
  `(
    "cuts the text after $limit characters on $viewport, shows more and less",
    async ({ desktop, limit }) => {
      isDesktop.value = desktop;
      const full = "a".repeat(limit + 1);
      const cut = `${"a".repeat(limit)}…`;
      const wrapper = render(full);
      const description = () =>
        wrapper.get('[data-testid="dataset-description"]').text();

      expect(description()).toBe(cut);
      expect(wrapper.get("button").text()).toBe("dataset.showMore");

      await wrapper.get("button").trigger("click");
      expect(description()).toBe(full);
      expect(wrapper.get("button").text()).toBe("dataset.showLess");

      await wrapper.get("button").trigger("click");
      expect(description()).toBe(cut);
    },
  );

  it("does not offer more or less when the text fits", () => {
    expect(render("Short").find("button").exists()).toBe(false);
  });
});
