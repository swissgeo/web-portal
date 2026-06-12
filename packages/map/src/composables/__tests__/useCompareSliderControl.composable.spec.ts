import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";

import type { CompareSliderControlOptions } from "../useCompareSliderControl.composable";

import useCompareSliderControl from "../useCompareSliderControl.composable";

/**
 * Mounts a minimal host that uses the composable. Deliberately NO map library
 * involved — just a plain DOM element — to prove the composable is engine
 * agnostic.
 */
async function mountHarness(
  options: Partial<CompareSliderControlOptions> = {},
) {
  // a plain element standing in for "the map", with a controllable rect
  const mapElement = document.createElement("div");
  mapElement.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500 }) as DOMRect;

  const onCommit = vi.fn();
  const onRatioChange = vi.fn();

  const control = {} as ReturnType<typeof useCompareSliderControl>;
  const Harness = defineComponent({
    setup() {
      Object.assign(
        control,
        useCompareSliderControl({
          compareRatio: () => 0.5,
          getMapElement: () => mapElement,
          onRatioChange,
          onCommit,
          ...options,
        }),
      );
      return () =>
        h("div", {
          "data-testid": "bar",
          style: control.sliderStyle.value,
          onMousedown: control.grabSlider,
        });
    },
  });

  const wrapper = mount(Harness);
  await flushPromises();
  return { wrapper, control, onCommit, onRatioChange, mapElement };
}

describe("useCompareSliderControl", () => {
  it("anchors the bar to the map element at the given ratio", async () => {
    const mapElement = document.createElement("div");
    mapElement.getBoundingClientRect = () =>
      ({ left: 100, top: 0, width: 1000, height: 500 }) as DOMRect;
    const { control } = await mountHarness({
      compareRatio: () => 0.5,
      getMapElement: () => mapElement,
    });

    // left = map.left (100) + ratio (0.5) * map.width (1000) = 600px
    expect(control.sliderStyle.value).toMatchObject({
      left: "600px",
      top: "0px",
      height: "500px",
    });
  });

  it("commits a clamped ratio when a drag ends", async () => {
    const { wrapper, onCommit } = await mountHarness();

    await wrapper.find('[data-testid="bar"]').trigger("mousedown");
    // map at viewport x=0 → clientX 300 over a 1000px map → ratio 0.3
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300 }));
    window.dispatchEvent(new MouseEvent("mouseup"));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]?.[0]).toBeCloseTo(0.3, 3);
  });

  it("keeps the bar away from the map edges while dragging", async () => {
    const { wrapper, control } = await mountHarness();

    await wrapper.find('[data-testid="bar"]').trigger("mousedown");
    // drag far past the left edge → clamped to EDGE_PADDING (14) / 1000
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: -500 }));

    expect(control.localRatio.value).toBeCloseTo(0.014, 3);
  });

  it("follows external ratio changes and asks the host to re-render", async () => {
    const externalRatio = ref(0.5);
    const { control, onRatioChange } = await mountHarness({
      compareRatio: () => externalRatio.value,
    });
    onRatioChange.mockClear();

    externalRatio.value = 0.8;
    await flushPromises();

    expect(control.localRatio.value).toBe(0.8);
    expect(control.sliderStyle.value).toMatchObject({ left: "800px" });
    expect(onRatioChange).toHaveBeenCalled();
  });
});
