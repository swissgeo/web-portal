import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import type { UseTimeSliderBarOptions } from "../composables/useTimeSliderBar";

import useTimeSliderBar from "../composables/useTimeSliderBar";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const ALL_YEARS = [
  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
];

function defaultOptions(
  overrides: Partial<UseTimeSliderBarOptions> = {},
): UseTimeSliderBarOptions {
  return {
    allYears: () => ALL_YEARS,
    modelValue: () => 2005,
    yearsWithData: () => ({
      yearsJoint: [2003, 2005, 2008],
      yearsSeparate: [2001, 2010],
    }),
    containerWidth: () => 800,
    getCursorElement: () => null,
    onUpdateModelValue: vi.fn(),
    onGrabbing: vi.fn(),
    ...overrides,
  };
}

async function mountHarness(opts: Partial<UseTimeSliderBarOptions> = {}) {
  const options = defaultOptions(opts);
  const control = {} as ReturnType<typeof useTimeSliderBar>;

  const Harness = defineComponent({
    setup() {
      Object.assign(control, useTimeSliderBar(options));
      return () => h("div", { "data-testid": "harness" });
    },
  });

  const wrapper = mount(Harness);
  await flushPromises();
  return { wrapper, control, options };
}

describe("useTimeSliderBar", () => {
  describe("inputYear", () => {
    it("returns the current modelValue when no falseYear is set", async () => {
      const { control } = await mountHarness({ modelValue: () => 2005 });
      expect(control.inputYear.value).toBe(2005);
    });

    it("sets the year via callback when a valid year is entered", async () => {
      const onUpdateModelValue = vi.fn();
      const { control } = await mountHarness({ onUpdateModelValue });

      control.inputYear.value = "2003";

      expect(onUpdateModelValue).toHaveBeenCalledWith(2003);
      expect(control.isInputYearValid.value).toBe(true);
    });

    it("marks input as invalid when an invalid year is entered", async () => {
      const { control } = await mountHarness();

      control.inputYear.value = "9999";

      expect(control.isInputYearValid.value).toBe(false);
    });

    it("allows clearing the input (empty string)", async () => {
      const { control } = await mountHarness();

      control.inputYear.value = "";

      expect(control.isInputYearValid.value).toBe(false);
    });
  });

  describe("tooltipYearOutsideRangeContent", () => {
    it("includes the year range in the message", async () => {
      const { control } = await mountHarness();
      expect(control.tooltipYearOutsideRangeContent.value).toContain("2000");
      expect(control.tooltipYearOutsideRangeContent.value).toContain("2010");
    });
  });

  describe("sliderWidth", () => {
    it("subtracts padding, play button, and gap from container width", async () => {
      const { control } = await mountHarness({ containerWidth: () => 800 });
      // 800 - 52 - 54 - 16 = 678
      expect(control.sliderWidth.value).toBe(678);
    });
  });

  describe("yearsShownAsLabel", () => {
    it("filters years by threshold based on available width", async () => {
      const { control } = await mountHarness({ containerWidth: () => 800 });
      const labels = control.yearsShownAsLabel.value;
      expect(labels.length).toBeGreaterThan(0);
      expect(labels).toContain(2000);
      expect(labels).toContain(2010);
    });

    it("uses a larger threshold for narrow containers", async () => {
      const wide = await mountHarness({ containerWidth: () => 800 });
      const narrow = await mountHarness({ containerWidth: () => 300 });
      expect(narrow.control.yearsShownAsLabel.value.length).toBeLessThanOrEqual(
        wide.control.yearsShownAsLabel.value.length,
      );
    });
  });

  describe("positionNodeLabel", () => {
    it("returns a left style for a given year", async () => {
      const { control } = await mountHarness();
      const pos = control.positionNodeLabel(2005);
      expect(pos.left).toMatch(/^\d+\.?\d*px$/);
    });
  });

  describe("drag interaction", () => {
    it("calls onGrabbing(true) on grabCursor", async () => {
      const onGrabbing = vi.fn();
      const { control } = await mountHarness({ onGrabbing });

      const event = new MouseEvent("mousedown", { screenX: 100 });
      control.grabCursor(event);

      expect(onGrabbing).toHaveBeenCalledWith(true);
    });

    it("calls onGrabbing(false) and removes listeners on mouseup", async () => {
      const onGrabbing = vi.fn();
      const { control } = await mountHarness({ onGrabbing });

      const event = new MouseEvent("mousedown", { screenX: 100 });
      control.grabCursor(event);
      window.dispatchEvent(new MouseEvent("mouseup"));

      expect(onGrabbing).toHaveBeenCalledWith(false);
    });

    it("advances the year when dragged past distanceBetweenLabels", async () => {
      const onUpdateModelValue = vi.fn();
      const { control } = await mountHarness({ onUpdateModelValue });

      const event = new MouseEvent("mousedown", { screenX: 500 });
      control.grabCursor(event);
      // Drag left by 200px (more than one tick spacing)
      window.dispatchEvent(new MouseEvent("mousemove", { screenX: 300 }));

      expect(onUpdateModelValue).toHaveBeenCalled();
    });

    it("does not go below the first year when dragged left past the edge", async () => {
      const onUpdateModelValue = vi.fn();
      const { control } = await mountHarness({
        modelValue: () => 2000,
        onUpdateModelValue,
      });

      const event = new MouseEvent("mousedown", { screenX: 500 });
      control.grabCursor(event);
      // Drag left (screenX decreases → deltaX positive → go back in year)
      window.dispatchEvent(new MouseEvent("mousemove", { screenX: 100 }));

      expect(onUpdateModelValue).toHaveBeenCalledWith(2000);
    });
  });

  describe("edge cases", () => {
    it("does not crash when allYears is empty", async () => {
      const { control } = await mountHarness({ allYears: () => [] });
      expect(control.sliderWidth.value).toBeDefined();
      expect(control.yearsShownAsLabel.value).toEqual([]);
    });

    it("does not crash when modelValue is undefined", async () => {
      const { control } = await mountHarness({ modelValue: () => undefined });
      expect(control.cursorPosition.value).toBeDefined();
    });

    it("does not crash when containerWidth is zero", async () => {
      const { control } = await mountHarness({ containerWidth: () => 0 });
      expect(control.sliderWidth.value).toBeLessThanOrEqual(0);
    });
  });
});
