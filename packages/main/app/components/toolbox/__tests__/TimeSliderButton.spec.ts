import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TimeSliderButton from "@/components/toolbox/toolboxButtons/TimeSliderButton.vue";

const { isEnabled, toggleTimeSlider } = vi.hoisted(() => ({
  isEnabled: vi.fn<(_path: string) => boolean>(),
  toggleTimeSlider: vi.fn(),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

mockNuxtImport("useFeatureFlags", () => () => ({ isEnabled }));
mockNuxtImport("useMapViewStore", () => () => ({
  isTimeSliderVisible: false,
  toggleTimeSlider,
}));
mockNuxtImport("useCmsUrl", () => () => ({
  cmsUrl: (path: string) => `https://cms.example.com${path}`,
}));

describe("TimeSliderButton.vue", () => {
  beforeEach(() => {
    isEnabled.mockReset();
    toggleTimeSlider.mockClear();
  });

  function mountButton(featureFlagEnabled: boolean) {
    isEnabled.mockReturnValue(featureFlagEnabled);

    return mount(TimeSliderButton, {
      global: {
        stubs: {
          UButton: {
            props: ["disabled"],
            template: '<button :disabled="disabled"><slot /></button>',
          },
          UPopover: { template: "<div><slot /></div>" },
          UIcon: true,
        },
      },
    });
  }

  it("disables the button and prevents toggling when the flag is off", async () => {
    const wrapper = mountButton(false);
    const button = wrapper.get<HTMLButtonElement>(
      '[data-testid="toolbox-time-slider-button"]',
    );

    expect(isEnabled).toHaveBeenCalledWith("tools.enableTimeSlider");
    expect(button.element.disabled).toBe(true);

    await button.trigger("click");

    expect(toggleTimeSlider).not.toHaveBeenCalled();
  });

  it("enables the button and toggles the slider when the flag is on", async () => {
    const wrapper = mountButton(true);
    const button = wrapper.get<HTMLButtonElement>(
      '[data-testid="toolbox-time-slider-button"]',
    );

    expect(isEnabled).toHaveBeenCalledWith("tools.enableTimeSlider");
    expect(button.element.disabled).toBe(false);

    await button.trigger("click");

    expect(toggleTimeSlider).toHaveBeenCalledExactlyOnceWith();
  });
});
