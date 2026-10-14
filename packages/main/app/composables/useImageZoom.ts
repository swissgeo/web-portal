import { computed, ref } from "vue";

const MIN_SCALE = 1;
const MAX_SCALE = 6;

export function useImageZoom() {
  const scale = ref(1);
  const translateX = ref(0);
  const translateY = ref(0);

  const isZoomed = computed(() => scale.value > MIN_SCALE);

  const imageStyle = computed(() => ({
    transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  }));

  const pointers = new Map<number, { x: number; y: number }>();
  let lastDistance = 0;
  let lastMidpoint: { x: number; y: number } | null = null;
  let lastPointer: { x: number; y: number } | null = null;
  let lastTapTime = -Infinity;
  let tapCandidate = false;

  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function midpoint(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): { x: number; y: number } {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function pairOfPointers():
    | [a: { x: number; y: number }, b: { x: number; y: number }]
    | null {
    const values = [...pointers.values()];
    const [a, b] = values;
    if (!a || !b) {
      return null;
    }
    return [a, b];
  }

  function clampTranslate(event: PointerEvent) {
    if (scale.value <= MIN_SCALE) {
      translateX.value = 0;
      translateY.value = 0;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const overflowX = ((scale.value - 1) * rect.width) / 2;
    const overflowY = ((scale.value - 1) * rect.height) / 2;
    translateX.value = Math.max(
      -overflowX,
      Math.min(overflowX, translateX.value),
    );
    translateY.value = Math.max(
      -overflowY,
      Math.min(overflowY, translateY.value),
    );
  }

  const TAP_THRESHOLD = 10;
  const DOUBLE_TAP_DELAY = 300;

  function onPointerDown(event: PointerEvent) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pair = pairOfPointers();
    if (pointers.size === 2 && pair) {
      lastDistance = distance(pair[0], pair[1]);
      lastMidpoint = midpoint(pair[0], pair[1]);
      tapCandidate = false;
    } else {
      lastPointer = { x: event.clientX, y: event.clientY };
      tapCandidate = true;
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (lastPointer) {
      const moved = Math.hypot(
        event.clientX - lastPointer.x,
        event.clientY - lastPointer.y,
      );
      if (moved > TAP_THRESHOLD) {
        tapCandidate = false;
      }
    }

    const pair = pairOfPointers();
    if (pair && lastDistance > 0 && lastMidpoint) {
      const [a, b] = pair;
      tapCandidate = false;
      const newDistance = distance(a, b);
      const newMidpoint = midpoint(a, b);

      const ratio = newDistance / lastDistance;
      scale.value = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, scale.value * ratio),
      );

      translateX.value += newMidpoint.x - lastMidpoint.x;
      translateY.value += newMidpoint.y - lastMidpoint.y;

      lastDistance = newDistance;
      lastMidpoint = newMidpoint;
      clampTranslate(event);
    } else if (pointers.size === 1 && lastPointer && scale.value > MIN_SCALE) {
      translateX.value += event.clientX - lastPointer.x;
      translateY.value += event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      clampTranslate(event);
    }
  }

  function onPointerEnd(event: PointerEvent) {
    const isTapCandidate = tapCandidate && pointers.size === 1;
    pointers.delete(event.pointerId);

    if (isTapCandidate) {
      const now = Date.now();
      if (now - lastTapTime < DOUBLE_TAP_DELAY) {
        if (isZoomed.value) {
          scale.value = MIN_SCALE;
          translateX.value = 0;
          translateY.value = 0;
        } else {
          scale.value = 2;
        }
        lastTapTime = -Infinity;
      } else {
        lastTapTime = now;
      }
    }
    tapCandidate = false;

    if (pointers.size < 2) {
      lastDistance = 0;
      lastMidpoint = null;
    }
    if (pointers.size === 0) {
      lastPointer = null;
    } else {
      const remaining = [...pointers.values()].at(0);
      if (remaining) {
        lastPointer = { x: remaining.x, y: remaining.y };
      }
    }
  }

  function reset() {
    scale.value = MIN_SCALE;
    translateX.value = 0;
    translateY.value = 0;
    pointers.clear();
    lastDistance = 0;
    lastMidpoint = null;
    lastPointer = null;
    lastTapTime = -Infinity;
    tapCandidate = false;
  }

  return {
    scale,
    isZoomed,
    imageStyle,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    reset,
  };
}
