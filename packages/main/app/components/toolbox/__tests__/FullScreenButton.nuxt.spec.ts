import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FullScreenButton from "@/components/toolbox/toolboxButtons/FullScreenButton.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("FullScreenButton.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mountButton() {
    return mount(FullScreenButton);
  }

  it("renders with the correct title", () => {
    const wrapper = mountButton();
    expect(wrapper.find("span:not(.iconify)").text()).toBe(
      "toolbox.fullscreen.buttonTitle",
    );
  });

  it("emits click event when button is clicked", async () => {
    const wrapper = mountButton();
    await wrapper.find('[data-testid="fullscreen-toggle"]').trigger("click");
    expect(wrapper.emitted()).toHaveProperty("click");
  });

  it("toggles fullscreen state when button is clicked", async () => {
    const wrapper = mountButton();
    const button = wrapper.find('[data-testid="fullscreen-toggle"]');

    const mapViewStore = useMapViewStore();

    expect(mapViewStore.isFullscreenModeActive).toBe(false);

    await button.trigger("click");
    expect(mapViewStore.isFullscreenModeActive).toBe(true);

    await button.trigger("click");
    expect(mapViewStore.isFullscreenModeActive).toBe(false);
  });
});
