import type { Ref } from "vue";

import { useEventListener } from "@vueuse/core";

/**
 * vaul-vue (built on Reka UI) lacks the touchmove guard that React vaul gets
 * from Radix's react-remove-scroll. Without it, swiping down on the list while
 * it is scrolled to the top starts a native scroll (or pull-to-refresh), which
 * cancels vaul's pointer drag, so the drawer can't be swiped down.
 * Below full height the content cannot scroll, so a pull up must also drag
 * the drawer open. Only a mostly vertical pull counts, so sideways swipes
 * still scroll.
 */
export function useDrawerTouchGuard(
  scroller: Readonly<Ref<HTMLElement | null>>,
  options: { isEnabled: () => boolean; isFullyExtended: () => boolean },
) {
  let touchStartX = 0;
  let touchStartY = 0;

  useEventListener(
    scroller,
    "touchstart",
    (touchEvent: TouchEvent) => {
      touchStartX = touchEvent.touches[0]!.clientX;
      touchStartY = touchEvent.touches[0]!.clientY;
    },
    { passive: true },
  );
  useEventListener(
    scroller,
    "touchmove",
    (touchEvent: TouchEvent) => {
      if (!options.isEnabled() || !scroller.value) {
        return;
      }
      const deltaX = touchEvent.touches[0]!.clientX - touchStartX;
      const deltaY = touchEvent.touches[0]!.clientY - touchStartY;
      const isPullingDown = deltaY > Math.abs(deltaX);
      const isPullingUp = -deltaY > Math.abs(deltaX);
      const isClosingDrawer = isPullingDown && scroller.value.scrollTop <= 0;
      const isOpeningDrawer = isPullingUp && !options.isFullyExtended();
      if ((isClosingDrawer || isOpeningDrawer) && touchEvent.cancelable) {
        touchEvent.preventDefault();
      }
    },
    { passive: false },
  );
}
