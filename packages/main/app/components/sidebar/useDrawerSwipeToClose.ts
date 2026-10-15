import type { Ref } from "vue";

import { useEventListener } from "@vueuse/core";
import { ref } from "vue";

const swipeSampleMs = 100;
const swipeProjectionMs = 300;

/**
 * vaul closes a partly open drawer only on a fast swipe. Like native sheets,
 * this also closes it when the end of the swipe carries it past half its
 * partial height.
 */
export function useDrawerSwipeToClose(
  drawer: Readonly<Ref<HTMLElement | null | undefined>>,
  options: {
    mayClose: () => boolean;
    // Snap point height in px, measured from the bottom of the window
    partialSnapHeight: () => number;
    onClose: () => void;
  },
) {
  const isOpen = ref(true);
  let isPressed = false;
  let swipeSamples: { time: number; y: number }[] = [];

  function trackSwipe(pointerEvent: PointerEvent) {
    const now = pointerEvent.timeStamp;
    swipeSamples = [
      ...swipeSamples.filter((sample) => now - sample.time <= swipeSampleMs),
      { time: now, y: pointerEvent.clientY },
    ];
  }

  // Speed at the end of the swipe in px/ms, positive downwards. A pause at the
  // start does not count, which makes a release feel like native sheets.
  function endSpeed() {
    const first = swipeSamples[0];
    const last = swipeSamples.at(-1);
    if (!first || !last || last.time === first.time) {
      return null;
    }
    return (last.y - first.y) / (last.time - first.time);
  }

  // Height of the drawer on screen: at the partial snap point and right now
  function visibleHeights(drawer: HTMLElement) {
    const boxBottom = drawer.offsetTop + drawer.offsetHeight;
    return {
      partial:
        options.partialSnapHeight() - window.innerHeight + drawer.offsetHeight,
      now: boxBottom - drawer.getBoundingClientRect().top,
    };
  }

  function shouldCloseOnRelease() {
    const speed = endSpeed();
    if (!options.mayClose() || speed === null || !drawer.value) {
      return false;
    }
    const heights = visibleHeights(drawer.value);
    const projectedHeight = heights.now - speed * swipeProjectionMs;
    return projectedHeight < heights.partial / 2;
  }

  function release() {
    if (isOpen.value && shouldCloseOnRelease()) {
      isOpen.value = false;
      // vaul reports no close it did not start, so close after its slide out
      drawer.value?.addEventListener("transitionend", options.onClose, {
        once: true,
      });
    }
    isPressed = false;
    swipeSamples = [];
  }

  useEventListener(drawer, "pointerdown", (pointerEvent: PointerEvent) => {
    isPressed = true;
    swipeSamples = [];
    trackSwipe(pointerEvent);
  });
  useEventListener(drawer, "pointermove", (pointerEvent: PointerEvent) => {
    if (isPressed) {
      trackSwipe(pointerEvent);
    }
  });
  useEventListener(drawer, "pointerup", release);
  useEventListener(drawer, "pointercancel", release);

  return { isOpen };
}
