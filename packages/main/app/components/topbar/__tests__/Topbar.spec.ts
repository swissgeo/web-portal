import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Topbar from "~/components/topbar/Topbar.vue";
import { describe, expect, it } from "vitest";

mockNuxtImport("useI18n", () => {
  return () => ({ t: (key: string) => key });
});

function mountTopbar() {
  return mount(Topbar, {
    shallow: true,
    global: {
      stubs: {
        UHeader: {
          template:
            '<header><slot name="left" /><slot /><div data-testid="desktop"><slot name="right" /></div><div data-testid="mobile"><slot name="body" /></div></header>',
        },
      },
    },
  });
}

describe("Topbar", () => {
  it.each(["desktop", "mobile"])(
    "provides mode and language controls in the %s header",
    (layout) => {
      const wrapper = mountTopbar();
      const region = wrapper.get(`[data-testid="${layout}"]`);

      expect(region.find("topbar-color-mode-button-stub").exists()).toBe(true);
      expect(region.find("topbar-language-switcher-button-stub").exists()).toBe(
        true,
      );
    },
  );

  it("forwards logo and search actions", () => {
    const wrapper = mountTopbar();
    const result = { id: "selected-result" };

    wrapper.getComponent({ name: "LogoPic" }).vm.$emit("logo-click");
    wrapper
      .getComponent({ name: "TopbarSearch" })
      .vm.$emit("result-selected", result);

    expect(wrapper.emitted("reset-app")).toHaveLength(1);
    expect(wrapper.emitted("search-result-selected")).toEqual([[result]]);
  });
});
