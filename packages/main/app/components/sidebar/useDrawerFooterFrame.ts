import type { Ref } from "vue";

import { useEventListener, useRafFn } from "@vueuse/core";
import { computed, watch } from "vue";

/**
 * vaul only slides the drawer box down, so its bottom leaves the screen. This
 * keeps the drawer container ending at the visible edge, so the footer stays
 * on screen, also while the drawer moves. With few rows it also sets the
 * height of the content, so the drawer opens only as high as its content.
 */
export function useDrawerFooterFrame(
  scroller: Readonly<Ref<HTMLElement | null>>,
  contentSnapHeight: Ref<number | null>,
  options: {
    isEnabled: () => boolean;
    isVisible: () => boolean;
    // A change measures the content height again, opening an item does not
    itemCount: () => number | undefined;
    // The drawer opens at most this high, in px from the bottom of the window
    maxSnapHeight: () => number;
    activeSnapPoint: Readonly<Ref<unknown>>;
  },
) {
  const container = computed(() =>
    scroller.value?.closest<HTMLElement>('[data-slot="container"]'),
  );
  const drawer = computed(() => container.value?.parentElement);
  let isPressed = false;

  const { resume, pause } = useRafFn(
    () => {
      if (!container.value || !drawer.value) {
        pause();
        return;
      }
      // offsetTop ignores the transform, the bounding box does not
      const visibleBottom = drawer.value.offsetTop + drawer.value.offsetHeight;
      const height = Math.max(
        minContainerHeight(container.value),
        visibleBottom - container.value.getBoundingClientRect().top,
      );
      container.value.style.height = `${height}px`;
      // Stop once the finger is up and the snap animation is over
      if (!isPressed && drawer.value.getAnimations().length === 0) {
        pause();
      }
    },
    { immediate: false },
  );

  // When the drawer closes, the first content row (the title) and the footer
  // leave the screen together
  function minContainerHeight(container: HTMLElement) {
    const firstRow = scroller.value?.querySelector<HTMLElement>(":scope > *");
    const footer = container.querySelector<HTMLElement>('[data-slot="footer"]');
    return (firstRow?.offsetHeight ?? 0) + (footer?.offsetHeight ?? 0);
  }

  function followDrawer() {
    // A hidden drawer has no size, so it is measured once it shows again
    if (options.isEnabled() && options.isVisible()) {
      resume();
    }
  }

  function fitToContent() {
    const footer = container.value?.querySelector<HTMLElement>(
      '[data-slot="footer"]',
    );
    if (
      !options.isVisible() ||
      !container.value ||
      !drawer.value ||
      !scroller.value ||
      !footer
    ) {
      return;
    }
    // scrollHeight never gets lower than the box, so measure where the content ends
    const lastRow = scroller.value.lastElementChild;
    const scrollerContentHeight = lastRow
      ? lastRow.getBoundingClientRect().bottom -
        scroller.value.getBoundingClientRect().top +
        scroller.value.scrollTop
      : 0;
    const contentHeight =
      container.value.offsetTop + scrollerContentHeight + footer.offsetHeight;
    // vaul places a px snap point this far above the bottom of the window
    const snapHeight =
      contentHeight + window.innerHeight - drawer.value.offsetHeight;
    contentSnapHeight.value =
      snapHeight < options.maxSnapHeight() ? snapHeight : null;
    followDrawer();
  }

  function setPressed(isDown: boolean) {
    isPressed = isDown;
    followDrawer();
  }

  useEventListener(drawer, "pointerdown", () => setPressed(true));
  useEventListener(drawer, "pointerup", () => setPressed(false));
  useEventListener(drawer, "pointercancel", () => setPressed(false));
  useEventListener(window, "resize", fitToContent);
  watch([scroller, options.itemCount, options.isVisible], fitToContent, {
    flush: "post",
  });
  watch(options.activeSnapPoint, followDrawer);

  return { drawer };
}
