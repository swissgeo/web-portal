import { round } from "@swissgeo/numbers";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

/** Minimum distance (px) the slider keeps from either edge of the map. */
const EDGE_PADDING = 14;

export interface CompareSliderControlOptions {
  /**
   * Getter for the externally-controlled ratio (e.g. the `compareRatio` prop),
   * in the open interval (0, 1). Read reactively so the slider follows changes
   * coming from the store/URL.
   */
  compareRatio: () => number;
  /**
   * Returns the DOM element the slider should be anchored to and measured
   * against — i.e. the element that actually contains the rendered map. This is
   * the only engine-specific input.
   */
  getMapElement: () => HTMLElement | null | undefined;
  /**
   * Called whenever the ratio changes (a drag move, or an external update),
   * letting the host trigger a re-render so the visual effect keeps up.
   */
  onRatioChange?: () => void;
  /** Called once when a drag ends, with the final ratio, to commit it upstream. */
  onCommit: (ratio: number) => void;
}

/**
 * Engine-agnostic control logic for a map compare/swipe slider: ratio state,
 * map-element measurement, drag handling and the resulting CSS positioning.
 *
 * It deliberately knows nothing about the underlying map library — it only
 * needs a DOM element to measure (`getMapElement`) and two callbacks to talk
 * back to the host. The actual clipping of a layer is the host's job; this
 * composable just tells it where the bar is.
 */
export default function useCompareSliderControl(
  options: CompareSliderControlOptions,
) {
  /**
   * Local, high-frequency copy of the ratio. It drives the bar position (and,
   * via `onRatioChange`, the host's clipping) while dragging without
   * round-tripping through the store; the host is only notified on release.
   */
  const localRatio = ref(options.compareRatio());

  /**
   * Bounding box of the map element in viewport coordinates. The slider is
   * positioned (fixed) against this box rather than via a CSS percentage,
   * because the clipping happens in the map's coordinate space — anchoring to
   * any other element (e.g. a full-width layout container) would make the bar
   * drift away from the actual layer border.
   */
  const mapRect = ref<DOMRect | null>(null);
  let resizeObserver: ResizeObserver | undefined;

  const sliderStyle = computed(() => {
    const rect = mapRect.value;
    if (!rect) {
      return { display: "none" };
    }
    return {
      left: `${rect.left + localRatio.value * rect.width}px`,
      top: `${rect.top}px`,
      height: `${rect.height}px`,
    };
  });

  function updateMapRect() {
    const element = options.getMapElement();
    if (element) {
      mapRect.value = element.getBoundingClientRect();
    }
  }

  /** @param clientX pointer position in viewport coordinates */
  function updateSliderPosition(clientX: number) {
    const width = mapRect.value?.width ?? 0;
    if (width <= 0) {
      return;
    }

    // position of the pointer within the map element
    const positionInMap = clientX - (mapRect.value?.left ?? 0);

    // keep the slider from going off either edge of the map
    const clamped = Math.min(
      Math.max(positionInMap, EDGE_PADDING),
      width - EDGE_PADDING,
    );

    localRatio.value = round(clamped / width, 3);
    options.onRatioChange?.();
  }

  function listenToMouseMove(event: MouseEvent) {
    updateSliderPosition(event.clientX);
  }

  function listenToTouchMove(event: TouchEvent) {
    updateSliderPosition(event.touches[0]?.clientX ?? 0);
  }

  function grabSlider() {
    // re-measure in case the layout shifted since the last update
    updateMapRect();
    window.addEventListener("mousemove", listenToMouseMove, { passive: true });
    window.addEventListener("touchmove", listenToTouchMove, { passive: true });
    window.addEventListener("mouseup", releaseSlider, { passive: true });
    window.addEventListener("touchend", releaseSlider, { passive: true });
  }

  function releaseSlider() {
    window.removeEventListener("mousemove", listenToMouseMove);
    window.removeEventListener("touchmove", listenToTouchMove);
    window.removeEventListener("mouseup", releaseSlider);
    window.removeEventListener("touchend", releaseSlider);
    if (localRatio.value !== options.compareRatio()) {
      options.onCommit(localRatio.value);
    }
  }

  // keep the local ratio in sync when the value changes from outside (store/URL)
  watch(
    () => options.compareRatio(),
    (newRatio) => {
      localRatio.value = newRatio;
      options.onRatioChange?.();
    },
  );

  // measure the map element and keep that measurement up to date: observe the
  // element itself for size changes, and the window for moves (resize/scroll)
  function startTrackingMapRect() {
    updateMapRect();

    const element = options.getMapElement();
    if (element) {
      resizeObserver = new ResizeObserver(updateMapRect);
      resizeObserver.observe(element);
    }
    window.addEventListener("resize", updateMapRect, { passive: true });
    window.addEventListener("scroll", updateMapRect, { passive: true });
  }

  onMounted(async () => {
    // wait a tick so the map element is laid out before measuring it
    await nextTick();
    startTrackingMapRect();
    options.onRatioChange?.();
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    window.removeEventListener("resize", updateMapRect);
    window.removeEventListener("scroll", updateMapRect);
    releaseSlider();
  });

  return {
    /** Current bar ratio, updated live during dragging. */
    localRatio,
    /** Measured map bounding box (or null before the first measurement). */
    mapRect,
    /** `:style` for the bar element — anchors it to the map at the ratio. */
    sliderStyle,
    /** Start a drag; bind to the bar's `mousedown` / `touchstart`. */
    grabSlider,
    /** Re-measure the map element on demand. */
    updateMapRect,
  };
}
