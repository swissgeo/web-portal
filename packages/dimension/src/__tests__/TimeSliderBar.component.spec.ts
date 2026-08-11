import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import TimeSliderBar from "@/TimeSliderBar.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/TimeSliderBarSteps.vue", () => ({
  default: defineComponent({
    name: "TimeSliderBarSteps",
    props: ["allYears", "yearsJoint", "yearsSeparate", "sliderWidth"],
    emits: ["select"],
    template: '<div data-testid="time-slider-bar-steps" />',
  }),
}));

vi.mock("@swissgeo/skeleton", () => ({
  UIcon: defineComponent({
    name: "UIcon",
    props: ["name"],
    template: '<span data-testid="ui-icon" />',
  }),
  UTooltip: defineComponent({
    name: "UTooltip",
    props: ["open", "text", "placement", "delayDuration", "arrow"],
    template: '<div data-testid="u-tooltip"><slot /></div>',
  }),
}));

const DEFAULT_YEARS = [2000, 2001, 2002, 2003, 2004, 2005];

function mountBar(
  props: {
    allYears?: number[];
    modelValue?: number;
    yearsWithData?: { yearsJoint: number[]; yearsSeparate: number[] };
    containerWidth?: number;
  } = {},
) {
  return mount(TimeSliderBar, {
    props: {
      allYears: DEFAULT_YEARS,
      modelValue: 2003,
      yearsWithData: { yearsJoint: [2000, 2003], yearsSeparate: [2001] },
      containerWidth: 800,
      ...props,
    },
  });
}

describe("TimeSliderBar.vue", () => {
  it("renders the slider bar container", () => {
    const wrapper = mountBar();
    expect(wrapper.find("[data-testid='time-slider-bar']").exists()).toBe(true);
  });

  it("renders the cursor grab area", () => {
    const wrapper = mountBar();
    expect(
      wrapper.find("[data-testid='time-slider-bar-cursor-grab']").exists(),
    ).toBe(true);
  });

  it("renders the year input", () => {
    const wrapper = mountBar();
    expect(
      wrapper.find("[data-testid='time-slider-bar-cursor-year']").exists(),
    ).toBe(true);
  });

  it("displays the current year in the input", () => {
    const wrapper = mountBar({ modelValue: 2005 });
    const input = wrapper.find("[data-testid='time-slider-bar-cursor-year']");
    expect((input.element as HTMLInputElement).value).toBe("2005");
  });

  it("displays empty input when modelValue is undefined", () => {
    const wrapper = mountBar({ modelValue: undefined });
    const input = wrapper.find("[data-testid='time-slider-bar-cursor-year']");
    expect((input.element as HTMLInputElement).value).toBe("");
  });

  it("emits update:modelValue when a valid year is entered", async () => {
    const wrapper = mountBar({ allYears: DEFAULT_YEARS });
    const input = wrapper.find("[data-testid='time-slider-bar-cursor-year']");

    await input.setValue("2004");

    expect(wrapper.emitted("update:modelValue")).toEqual([[2004]]);
  });

  it("marks input as invalid for a year outside the range", async () => {
    const wrapper = mountBar();
    const input = wrapper.find("[data-testid='time-slider-bar-cursor-year']");

    await input.setValue("9999");

    expect(input.classes()).toContain("is-invalid");
  });

  it("prevents non-numeric key input", async () => {
    const wrapper = mountBar();
    const input = wrapper.find("[data-testid='time-slider-bar-cursor-year']");

    await input.trigger("keydown", { key: "a" });
    await input.trigger("keydown", { key: "Backspace" });
    await input.trigger("keydown", { key: "Enter" });

    expect(input.classes()).not.toContain("is-invalid");
  });

  it("allows numeric key input", async () => {
    const wrapper = mountBar();
    const input = wrapper.find("[data-testid='time-slider-bar-cursor-year']");

    await input.trigger("keydown", { key: "5" });

    expect(input.classes()).not.toContain("is-invalid");
  });

  it("renders the cursor arrow", () => {
    const wrapper = mountBar();
    expect(
      wrapper.find("[data-testid='time-slider-bar-cursor-arrow']").exists(),
    ).toBe(true);
  });

  it("emits grabbing on mousedown on cursor grab area", async () => {
    const wrapper = mountBar();
    const grabArea = wrapper.find(
      "[data-testid='time-slider-bar-cursor-grab']",
    );

    await grabArea.trigger("mousedown");

    expect(wrapper.emitted("grabbing")).toEqual([[true]]);
  });

  it("emits grabbing on touchstart on cursor grab area", () => {
    const wrapper = mountBar();
    const grabArea = wrapper.find(
      "[data-testid='time-slider-bar-cursor-grab']",
    );

    const touchEvent = new Event("touchstart", { bubbles: true });
    Object.defineProperty(touchEvent, "touches", {
      value: [{ screenX: 100 }],
      writable: false,
    });
    grabArea.element.dispatchEvent(touchEvent);

    expect(wrapper.emitted("grabbing")).toEqual([[true]]);
  });

  it("passes sliderWidth to TimeSliderBarSteps", () => {
    const wrapper = mountBar({ containerWidth: 800 });
    const steps = wrapper.findComponent({ name: "TimeSliderBarSteps" });
    expect(steps.props("sliderWidth")).toBe(678);
  });

  it("passes yearsWithData to TimeSliderBarSteps", () => {
    const yearsWithData = { yearsJoint: [2000, 2003], yearsSeparate: [2001] };
    const wrapper = mountBar({ yearsWithData });
    const steps = wrapper.findComponent({ name: "TimeSliderBarSteps" });
    expect(steps.props("yearsJoint")).toEqual([2000, 2003]);
    expect(steps.props("yearsSeparate")).toEqual([2001]);
  });

  it("forwards select event from TimeSliderBarSteps to emit update:modelValue", async () => {
    const wrapper = mountBar({ allYears: DEFAULT_YEARS });
    const steps = wrapper.findComponent({ name: "TimeSliderBarSteps" });

    await steps.vm.$emit("select", 2001);

    expect(wrapper.emitted("update:modelValue")).toEqual([[2001]]);
  });

  it("renders year labels for years with data", () => {
    const wrapper = mountBar({
      allYears: [2000, 2005, 2010, 2015, 2020],
      yearsWithData: { yearsJoint: [2000, 2010, 2020], yearsSeparate: [] },
    });
    expect(wrapper.html()).toContain("2000");
    expect(wrapper.html()).toContain("2010");
    expect(wrapper.html()).toContain("2020");
  });
});
