<script lang="ts" setup>
import { useEventListener, useRafFn } from "@vueuse/core";
import { panelSnapPointKey } from "~/types/injectionKeys";

const {
  hasHeader = true,
  isVisible = true,
  isDismissible = true,
  itemCount,
  collapseLabel,
  expandLabel,
} = defineProps<{
  title: string;
  closeLabel: string;
  expandLabel: string;
  collapseLabel: string;
  hasHeader?: boolean;
  isVisible?: boolean;
  isDismissible?: boolean;
  // A change measures the content height again, opening an item does not
  itemCount?: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

const slots = defineSlots<{
  default: () => unknown;
  footer?: () => unknown;
}>();

const isDesktop = useIsDesktop();

const defaultPartialSnapPoint = 0.75;
// With few rows the drawer opens only as high as its content
const contentSnapHeight = ref<number | null>(null);

const partialSnapPoint = computed(() =>
  contentSnapHeight.value === null
    ? defaultPartialSnapPoint
    : `${contentSnapHeight.value}px`,
);
const fullSnapPoint = 1;
// panels can either close or only shrink.
// measure for non closing panels (height - 200) :  header  + footer +  draghandle.
const minimizedSnapPoint = "200px";
const snapPoints = computed(() =>
  isDismissible
    ? [partialSnapPoint.value, fullSnapPoint]
    : [minimizedSnapPoint, partialSnapPoint.value, fullSnapPoint],
);
const sharedSnapPoint = inject(
  panelSnapPointKey,
  ref<number | string | null>(null),
);
const hasSharedSnapPoint = computed(
  () =>
    sharedSnapPoint.value !== null &&
    snapPoints.value.includes(sharedSnapPoint.value),
);
// if snap points can't be inferred, this falls back to partially open
const activeSnapPoint = computed({
  get: () =>
    hasSharedSnapPoint.value ? sharedSnapPoint.value : partialSnapPoint.value,
  set: (snapPoint) => {
    // A hidden panel falls back to partial and must not overwrite the visible one
    if (isVisible) {
      sharedSnapPoint.value = snapPoint;
    }
  },
});

const isFullyExtended = computed(() => activeSnapPoint.value === fullSnapPoint);

// A click in another panel counts as outside, so a hidden panel must not close.
const isCurrentlyDismissible = computed(() => isDismissible && isVisible);

const resizeLabel = computed(() =>
  isFullyExtended.value ? collapseLabel : expandLabel,
);

function toggleExpanded() {
  activeSnapPoint.value = isFullyExtended.value
    ? partialSnapPoint.value
    : fullSnapPoint;
}

const scroller = useTemplateRef<HTMLElement>("scroller");
provide(panelScrollerKey, scroller);

// iOS moves the whole page when the keyboard would cover the focused field
// (https://bugs.webkit.org/show_bug.cgi?id=176205). A fully open panel keeps
// the field above the keyboard.
useEventListener(scroller, "focusin", (focusEvent: FocusEvent) => {
  if (!isDesktop.value && focusEvent.target instanceof HTMLInputElement) {
    activeSnapPoint.value = fullSnapPoint;
  }
});

// Decide whether the panel is scrollable or not:
// - It is always scrollable on desktop (in the sidebar)
// - On mobile, it is only scrollable when fully extended
//   When only shown on the bottom of the screen swiping up actually
//   extends the panel to cover (almost) the entire screen, so we shouldn't
//   show scrollbars in that case because it is not scrollable.
const scrollerClass = computed(() => [
  "scroll-fade min-h-0 flex-1 overscroll-y-contain",
  isDesktop.value || isFullyExtended.value
    ? "overflow-y-auto"
    : "overflow-hidden",
]);

// vaul only slides the drawer box down, so its bottom leaves the screen.
// The container ends at the visible edge to keep the footer on screen.
const container = computed(() =>
  scroller.value?.closest<HTMLElement>('[data-slot="container"]'),
);
const drawer = computed(() => container.value?.parentElement);
let isDragging = false;
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
    if (!isDragging && drawer.value.getAnimations().length === 0) {
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
  if (slots.footer && !isDesktop.value && isVisible) {
    resume();
  }
}

function fitToContent() {
  const footer = container.value?.querySelector<HTMLElement>(
    '[data-slot="footer"]',
  );
  if (
    !isVisible ||
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
  const snapHeight =
    contentHeight + window.innerHeight - drawer.value.offsetHeight;
  contentSnapHeight.value =
    snapHeight < defaultPartialSnapPoint * window.innerHeight
      ? snapHeight
      : null;
  followDrawer();
}

function setDragging(isPressed: boolean) {
  isDragging = isPressed;
  followDrawer();
}

useEventListener(drawer, "pointerdown", () => setDragging(true));
useEventListener(drawer, "pointerup", () => setDragging(false));
useEventListener(drawer, "pointercancel", () => setDragging(false));
useEventListener(window, "resize", fitToContent);
watch([scroller, () => itemCount, () => isVisible], fitToContent, {
  flush: "post",
});
watch(activeSnapPoint, followDrawer);

// vaul-vue (built on Reka UI) lacks the touchmove guard that React vaul gets
// from Radix's react-remove-scroll. Without it, swiping down on the list while
// it is scrolled to the top starts a native scroll (or pull-to-refresh), which
// cancels vaul's pointer drag, so the drawer can't be swiped down.
// Below full height the content cannot scroll, so a pull up must also drag
// the drawer open. Only a mostly vertical pull counts, so sideways swipes
// still scroll.
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
    if (isDesktop.value || !scroller.value) {
      return;
    }
    const deltaX = touchEvent.touches[0]!.clientX - touchStartX;
    const deltaY = touchEvent.touches[0]!.clientY - touchStartY;
    const isPullingDown = deltaY > Math.abs(deltaX);
    const isPullingUp = -deltaY > Math.abs(deltaX);
    const isClosingDrawer = isPullingDown && scroller.value.scrollTop <= 0;
    const isOpeningDrawer = isPullingUp && !isFullyExtended.value;
    if ((isClosingDrawer || isOpeningDrawer) && touchEvent.cancelable) {
      touchEvent.preventDefault();
    }
  },
  { passive: false },
);
</script>

<template>
  <UDrawer
    v-if="!isDesktop"
    open
    :title="title"
    v-model:activeSnapPoint="activeSnapPoint"
    :snapPoints="snapPoints"
    :dismissible="isCurrentlyDismissible"
    :modal="false"
    :overlay="false"
    portal="#main"
    :ui="{
      // For 'full' extension of the panel, stop 'a bit below the topbar' (half the topbar height),
      // so a bit of the map remains visible.
      // Leave 4rem space below for the footer.
      // The drawer teleports to #main, so a v-show on a parent does not hide it.
      content: `bottom-16 z-20 h-[calc(100%-1.5*var(--ui-header-height)-4rem)] ${isVisible ? '' : 'hidden'}`,
      // vaul drags the drawer itself, so handle and header skip native swipes
      container: `min-h-0 touch-none gap-0 overflow-hidden p-0 ${slots.footer ? 'flex-none' : 'flex-1'}`,
      // The theme spaces the handle for a padded container, which this is not
      handle: 'my-2 touch-none',
      header: hasHeader ? 'px-4 py-3' : 'sr-only',
      title: 'text-sm font-semibold text-highlighted uppercase',
      body: 'flex min-h-0 flex-1 flex-col',
      footer: 'p-0',
    }"
    @update:open="
      (isOpen) => {
        if (!isOpen) emit('close');
      }
    "
  >
    <template #body>
      <button
        class="sr-only focus:not-sr-only focus:px-4 focus:py-2 focus:text-left"
        @click="toggleExpanded"
      >
        {{ resizeLabel }}
      </button>
      <div
        ref="scroller"
        data-testid="panel-scroller"
        :class="scrollerClass"
      ></div>
    </template>
    <template v-if="slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UDrawer>

  <div v-else v-show="isVisible" class="flex min-h-0 flex-1 flex-col">
    <div
      v-if="hasHeader"
      class="flex items-center justify-between border-b border-default px-4 py-3"
    >
      <h3 class="text-sm font-semibold text-highlighted uppercase">
        {{ title }}
      </h3>
      <UButton
        color="primary"
        variant="outline"
        size="xs"
        trailing-icon="i-lucide-x"
        class="cursor-pointer"
        @click="emit('close')"
      >
        {{ closeLabel }}
      </UButton>
    </div>
    <div
      ref="scroller"
      data-testid="panel-scroller"
      :class="scrollerClass"
    ></div>
  </div>

  <!-- The content is rendered once and moved into the container on screen,
       so it keeps its state when the drawer and the sidebar switch. -->
  <Teleport :to="scroller" :disabled="!scroller">
    <slot />
  </Teleport>
</template>
