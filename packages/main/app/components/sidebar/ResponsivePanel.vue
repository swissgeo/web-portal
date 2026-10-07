<script lang="ts" setup>
import { useEventListener } from "@vueuse/core";
import { panelSnapPointKey } from "~/types/injectionKeys";

const {
  hasHeader = true,
  isVisible = true,
  isDismissible = true,
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
}>();

const emit = defineEmits<{
  close: [];
}>();

defineSlots<{
  default: () => unknown;
}>();

const isDesktop = useIsDesktop();

const partialSnapPoint = 0.6;
const fullSnapPoint = 1;
// panels can either close or only shrink.
// measure for non closing panels (height - 200) :  header  + footer +  draghandle.
const minimizedSnapPoint = "200px";
const snapPoints = computed(() =>
  isDismissible
    ? [partialSnapPoint, fullSnapPoint]
    : [minimizedSnapPoint, partialSnapPoint, fullSnapPoint],
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
    hasSharedSnapPoint.value ? sharedSnapPoint.value : partialSnapPoint,
  set: (snapPoint) => {
    sharedSnapPoint.value = snapPoint;
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
    ? partialSnapPoint
    : fullSnapPoint;
}

const scroller = useTemplateRef<HTMLElement>("scroller");
provide(panelScrollerKey, scroller);

// Decide whether the panel is scrollable or not:
// - It is always scrollable on desktop (in the sidebar)
// - On mobile, it is only scrollable when fully extended
//   When only shown on the bottom of the screen swiping up actually
//   extends the panel to cover (almost) the entire screen, so we shouldn't
//   show scrollbars in that case because it is not scrollable.
const scrollerClass = computed(() => [
  "min-h-0 flex-1 overscroll-y-contain",
  isDesktop.value || isFullyExtended.value
    ? "overflow-y-auto"
    : "overflow-hidden",
]);

// vaul-vue (built on Reka UI) lacks the touchmove guard that React vaul gets
// from Radix's react-remove-scroll. Without it, swiping down on the list while
// it is scrolled to the top starts a native scroll (or pull-to-refresh), which
// cancels vaul's pointer drag, so the drawer can't be swiped down.
// Only a mostly vertical pull counts, so sideways swipes still scroll.
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
    if (
      isPullingDown &&
      scroller.value.scrollTop <= 0 &&
      touchEvent.cancelable
    ) {
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
      container: 'min-h-0 flex-1 gap-0 overflow-hidden p-0',
      // The theme spaces the handle for a padded container, which this is not
      handle: 'my-2',
      header: hasHeader ? 'px-4 py-3' : 'sr-only',
      title: 'text-sm font-semibold text-highlighted uppercase',
      body: 'flex min-h-0 flex-1 flex-col',
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
      <div ref="scroller" data-testid="panel-scroller" :class="scrollerClass">
        <slot />
      </div>
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
    <div ref="scroller" data-testid="panel-scroller" :class="scrollerClass">
      <slot />
    </div>
  </div>
</template>
