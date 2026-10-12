import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import TimeSliderButton from "~/components/map/TimeSliderButton.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
mockNuxtImport("useMapViewStore", () => () => ({ isTimeSliderVisible: true }));

vi.mock("@swissgeo/skeleton", () => ({
  useSidebarStore: () => ({ sidebarWidth: 347 }),
}));
vi.mock("@swissgeo/dimension", () => ({
  TimeSlider: { name: "TimeSlider", template: "<div />" },
}));

describe("TimeSliderButton", () => {
  beforeEach(() => {
    isDesktop.value = true;
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
});
