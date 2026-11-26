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
    // A change measures the content height again, e.g. when the footer grows
    contentVersion: () => number | undefined;
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

  function measureContent(scroller: HTMLElement) {
    // scrollHeight never gets lower than the box, so measure where the content ends.
    // A hidden content sits above the scroller top and must not shrink the result.
    const lastRow = scroller.lastElementChild;
    if (!lastRow) {
      return 0;
    }
    return Math.max(
      0,
      lastRow.getBoundingClientRect().bottom -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop,
    );
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
    const containerElement = container.value;
    const drawerElement = drawer.value;
    // vaul places a px snap point this far above the bottom of the window
    const snapPointFor = (contentHeight: number) =>
      contentHeight + window.innerHeight - drawerElement.offsetHeight;
    const snapHeight = snapPointFor(
      containerElement.offsetTop +
        measureContent(scroller.value) +
        footer.offsetHeight,
    );
    const footerSnapHeight = snapPointFor(
      containerElement.offsetTop + footer.offsetHeight,
    );
    // The footer cannot scroll, so it may open the drawer past the partial
    // limit when the rest of the content would only be scrolled away.
    const maxSnapHeight = options.maxSnapHeight();
    const footerNeedsMoreRoom =
      drawerElement.offsetHeight > 0 && footerSnapHeight > maxSnapHeight;
    contentSnapHeight.value =
      snapHeight < maxSnapHeight ||
      (footerNeedsMoreRoom && snapHeight <= window.innerHeight)
        ? snapHeight
        : null;
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
  // An expanding footer measures too small while its animation runs
  useEventListener(container, "animationend", fitToContent);
  watch(
    [scroller, options.itemCount, options.contentVersion, options.isVisible],
    fitToContent,
    { flush: "post" },
  );
  watch(options.activeSnapPoint, followDrawer);

  return { drawer };
}
