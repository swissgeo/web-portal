import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ContextMenuPopup from "../map/contextMenu/ContextMenuPopup.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: "en" } }),
}));

mockNuxtImport("useFeatureFlags", () => () => ({ isEnabled: () => false }));
mockNuxtImport("useCmsUrl", () => () => ({
  cmsUrl: (path?: string) => `https://cms.test/en/${path ?? ""}`,
}));

describe("ContextMenuPopup", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("closes the coming soon notice with its close button", async () => {
    const close = vi.fn();
    const wrapper = mount(ContextMenuPopup, {
      props: { coordinate: [0, 0], isVisible: true, close },
      global: {
        stubs: {
          // data-testid and the click listener fall through to the button
          UButton: { template: "<button><slot /></button>" },
        },
      },
    });

    expect(wrapper.text()).toContain(
      "map.contextMenuPopup.featureFlag.notAvailable",
    );
    await wrapper
      .find("[data-testid='context-menu-disabled-close']")
      .trigger("click");

    expect(close).toHaveBeenCalledOnce();
  });
});
