import { beforeEach, describe, expect, it, vi } from "vitest";

import { useImageZoom } from "./useImageZoom";

function pointerEvent(
  type: string,
  id: number,
  x: number,
  y: number,
  target?: { getBoundingClientRect: () => DOMRect },
): PointerEvent {
  return {
    type,
    pointerId: id,
    clientX: x,
    clientY: y,
    currentTarget: target ?? null,
  } as unknown as PointerEvent;
}

const rectTarget = {
  setPointerCapture: () => {},
  getBoundingClientRect: () =>
    ({
      width: 400,
      height: 300,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      toJSON: () => ({}),
    }) as DOMRect,
};

describe("useImageZoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts at scale 1 with no translation", () => {
    const { scale, isZoomed, imageStyle } = useImageZoom();
    expect(scale.value).toBe(1);
    expect(isZoomed.value).toBe(false);
    expect(imageStyle.value.transform).toBe("translate(0px, 0px) scale(1)");
  });

  it("pinch zooms the image between min and max scale", () => {
    const { scale, onPointerDown, onPointerMove, onPointerEnd } =
      useImageZoom();

    onPointerDown(pointerEvent("pointerdown", 1, 100, 150, rectTarget));
    onPointerDown(pointerEvent("pointerdown", 2, 200, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 1, 50, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 2, 250, 150, rectTarget));

    expect(scale.value).toBeCloseTo(2);

    onPointerEnd(pointerEvent("pointerup", 1, 50, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 2, 250, 150, rectTarget));
  });

  it("clamps scale at max 6", () => {
    const { scale, onPointerDown, onPointerMove, onPointerEnd } =
      useImageZoom();

    onPointerDown(pointerEvent("pointerdown", 1, 190, 150, rectTarget));
    onPointerDown(pointerEvent("pointerdown", 2, 210, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 1, 0, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 2, 400, 150, rectTarget));

    expect(scale.value).toBeLessThanOrEqual(6);

    onPointerEnd(pointerEvent("pointerup", 1, 0, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 2, 400, 150, rectTarget));
  });

  it("pinch out then in returns to scale 1 and snaps translation to 0", () => {
    const { scale, imageStyle, onPointerDown, onPointerMove, onPointerEnd } =
      useImageZoom();

    onPointerDown(pointerEvent("pointerdown", 1, 100, 150, rectTarget));
    onPointerDown(pointerEvent("pointerdown", 2, 200, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 1, 50, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 2, 250, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 1, 100, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 2, 200, 150, rectTarget));

    expect(scale.value).toBeCloseTo(1);
    expect(imageStyle.value.transform).toBe("translate(0px, 0px) scale(1)");

    onPointerEnd(pointerEvent("pointerup", 1, 100, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 2, 200, 150, rectTarget));
  });

  it("pans with one pointer only while zoomed and clamps translation", () => {
    const {
      scale,
      imageStyle,
      onPointerDown,
      onPointerMove,
      onPointerEnd,
      reset,
    } = useImageZoom();

    onPointerDown(pointerEvent("pointerdown", 1, 100, 150, rectTarget));
    onPointerDown(pointerEvent("pointerdown", 2, 200, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 1, 50, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 2, 250, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 1, 50, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 2, 250, 150, rectTarget));

    expect(scale.value).toBeCloseTo(2);

    onPointerDown(pointerEvent("pointerdown", 3, 100, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 3, 10_000, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 3, 10_000, 150, rectTarget));

    // At scale 2, width 400: translation is clamped to +/-200px
    expect(imageStyle.value.transform).toContain("translate(200px");

    reset();
    expect(scale.value).toBe(1);
  });

  it("double tap toggles between 1x and 2x", () => {
    const { scale, onPointerDown, onPointerEnd } = useImageZoom();

    onPointerDown(pointerEvent("pointerdown", 1, 100, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 1, 100, 150, rectTarget));
    vi.advanceTimersByTime(100);
    onPointerDown(pointerEvent("pointerdown", 2, 100, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 2, 100, 150, rectTarget));

    expect(scale.value).toBe(2);

    vi.advanceTimersByTime(100);
    onPointerDown(pointerEvent("pointerdown", 3, 100, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 3, 100, 150, rectTarget));
    vi.advanceTimersByTime(100);
    onPointerDown(pointerEvent("pointerdown", 4, 100, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 4, 100, 150, rectTarget));

    expect(scale.value).toBe(1);
  });

  it("reset restores initial state", () => {
    const {
      scale,
      imageStyle,
      onPointerDown,
      onPointerMove,
      onPointerEnd,
      reset,
    } = useImageZoom();

    onPointerDown(pointerEvent("pointerdown", 1, 100, 150, rectTarget));
    onPointerDown(pointerEvent("pointerdown", 2, 200, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 1, 50, 150, rectTarget));
    onPointerMove(pointerEvent("pointermove", 2, 250, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 1, 50, 150, rectTarget));
    onPointerEnd(pointerEvent("pointerup", 2, 250, 150, rectTarget));

    reset();

    expect(scale.value).toBe(1);
    expect(imageStyle.value.transform).toBe("translate(0px, 0px) scale(1)");
  });
});
