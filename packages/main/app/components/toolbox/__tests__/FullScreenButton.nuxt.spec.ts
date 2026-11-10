import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FullScreenButton from "@/components/toolbox/toolboxButtons/FullScreenButton.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("FullScreenButton.vue", () => {
  let fullscreenElement: Element | null = null;

  beforeEach(() => {
    setActivePinia(createPinia());
    fullscreenElement = null;
    vi.spyOn(document, "fullscreenElement", "get").mockImplementation(
      () => fullscreenElement,
    );
    document.documentElement.requestFullscreen = vi.fn(() => {
      fullscreenElement = document.documentElement;
      return Promise.resolve();
    });
    document.exitFullscreen = vi.fn(() => {
      fullscreenElement = null;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    await wrapper
      .find('[data-testid="toolbox-fullscreen-button"]')
      .trigger("click");
    expect(wrapper.emitted()).toHaveProperty("click");
  });

  it("toggles fullscreen state when button is clicked", async () => {
    const wrapper = mountButton();
    const button = wrapper.find('[data-testid="toolbox-fullscreen-button"]');

    const mapViewStore = useMapViewStore();

    expect(mapViewStore.isFullscreenModeActive).toBe(false);

    await button.trigger("click");
    expect(mapViewStore.isFullscreenModeActive).toBe(true);

    await button.trigger("click");
    expect(mapViewStore.isFullscreenModeActive).toBe(false);
  });

  it("requests and exits the browser fullscreen", async () => {
    const button = mountButton().find(
      '[data-testid="toolbox-fullscreen-button"]',
    );

    await button.trigger("click");
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledOnce();

    await button.trigger("click");
    expect(document.exitFullscreen).toHaveBeenCalledOnce();
  });

  it("leaves the fullscreen mode when the browser exits fullscreen", async () => {
    const wrapper = mountButton();
    const mapViewStore = useMapViewStore();
    await wrapper
      .find('[data-testid="toolbox-fullscreen-button"]')
      .trigger("click");
    expect(mapViewStore.isFullscreenModeActive).toBe(true);

    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));
    expect(mapViewStore.isFullscreenModeActive).toBe(false);
  });
});
