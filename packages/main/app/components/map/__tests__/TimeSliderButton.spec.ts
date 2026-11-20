import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import TimeSliderButton from "~/components/map/TimeSliderButton.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
const mapViewStore = {
  isTimeSliderVisible: true,
  isFullscreenModeActive: false,
};
mockNuxtImport("useMapViewStore", () => () => mapViewStore);

vi.mock("@swissgeo/skeleton", () => ({
  useSidebarStore: () => ({ sidebarContentWidth: 347 }),
}));
vi.mock("@swissgeo/dimension", () => ({
  TimeSlider: { name: "TimeSlider", template: "<div />" },
}));

describe("TimeSliderButton", () => {
  beforeEach(() => {
    isDesktop.value = true;
    mapViewStore.isFullscreenModeActive = false;
  });

  it.each`
    desktop  | left
    ${true}  | ${"355px"}
    ${false} | ${"8px"}
  `("starts at $left with desktop=$desktop", ({ desktop, left }) => {
    isDesktop.value = desktop;

    const wrapper = mount(TimeSliderButton);

    expect((wrapper.element as HTMLElement).style.left).toBe(left);
  });

  it("starts below the test site banner and the topbar", () => {
    const wrapper = mount(TimeSliderButton);

    expect(wrapper.classes()).toContain(
      "top-[calc(var(--test-site-banner-height,0px)+var(--ui-header-height)+1rem)]",
    );
  });

  it("starts below the test site banner only in fullscreen", () => {
    mapViewStore.isFullscreenModeActive = true;

    const wrapper = mount(TimeSliderButton);

    expect(wrapper.classes()).toContain(
      "top-[calc(var(--test-site-banner-height,0px)+1rem)]",
    );
  });
});
