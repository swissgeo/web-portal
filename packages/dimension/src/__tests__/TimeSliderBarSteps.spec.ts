import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TimeSliderBarSteps from "@/TimeSliderBarSteps.vue";

function mountSteps(
  props: {
    allYears?: number[];
    yearsJoint?: number[];
    yearsSeparate?: number[];
    sliderWidth?: number;
  } = {},
) {
  return mount(TimeSliderBarSteps, {
    props: {
      allYears: [2000, 2001, 2002, 2003, 2005, 2010],
      yearsJoint: [2000, 2010],
      yearsSeparate: [2001],
      sliderWidth: 400,
      ...props,
    },
  });
}

describe("TimeSliderBarSteps.vue", () => {
  it("renders a button for each year in allYears", () => {
    const wrapper = mountSteps();
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(6);
  });

  it("sets data-testid on each button", () => {
    const wrapper = mountSteps({ allYears: [1990, 2005] });
    expect(wrapper.find("[data-testid='time-slider-bar-1990']").exists()).toBe(
      true,
    );
    expect(wrapper.find("[data-testid='time-slider-bar-2005']").exists()).toBe(
      true,
    );
  });

  it("applies big-tick class for years divisible by 10", () => {
    const wrapper = mountSteps({ allYears: [2000, 2005, 2010] });
    expect(
      wrapper.find("[data-testid='time-slider-bar-2000']").classes(),
    ).toContain("big-tick");
    expect(
      wrapper.find("[data-testid='time-slider-bar-2010']").classes(),
    ).toContain("big-tick");
    expect(
      wrapper.find("[data-testid='time-slider-bar-2005']").classes(),
    ).not.toContain("big-tick");
  });

  it("applies bg-primary-300 for years in yearsJoint", () => {
    const wrapper = mountSteps({ allYears: [2000, 2005], yearsJoint: [2000] });
    expect(
      wrapper.find("[data-testid='time-slider-bar-2000']").classes(),
    ).toContain("bg-primary-300");
  });

  it("applies bg-primary-50 for years in yearsSeparate", () => {
    const wrapper = mountSteps({ allYears: [2005], yearsSeparate: [2005] });
    expect(
      wrapper.find("[data-testid='time-slider-bar-2005']").classes(),
    ).toContain("bg-primary-50");
  });

  it("applies bg-gray-300 for years not in joint or separate", () => {
    const wrapper = mountSteps({ allYears: [2005] });
    expect(
      wrapper.find("[data-testid='time-slider-bar-2005']").classes(),
    ).toContain("bg-gray-300");
  });

  it("prefers yearsJoint over yearsSeparate when year is in both", () => {
    const wrapper = mountSteps({
      allYears: [2005],
      yearsJoint: [2005],
      yearsSeparate: [2005],
    });
    const btn = wrapper.find("[data-testid='time-slider-bar-2005']");
    expect(btn.classes()).toContain("bg-primary-300");
    expect(btn.classes()).not.toContain("bg-primary-50");
  });

  it("emits select with the year when a button is clicked", async () => {
    const wrapper = mountSteps({ allYears: [2003] });
    await wrapper.find("[data-testid='time-slider-bar-2003']").trigger("click");
    expect(wrapper.emitted("select")).toEqual([[2003]]);
  });

  it("sets container width from sliderWidth prop", () => {
    const wrapper = mountSteps({ sliderWidth: 600 });
    expect(wrapper.find("div").attributes("style")).toContain("width: 600px");
  });
});
