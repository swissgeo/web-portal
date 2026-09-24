<script lang="ts" setup>
import { onKeyStroke, useEventListener } from "@vueuse/core";

defineProps<{
  title: string;
  closeLabel: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

defineSlots<{
  default: () => unknown;
}>();

const isDesktop = useIsDesktop();

const snapPoints = [0.6, 1];
const activeSnapPoint = ref<number | string | null>(snapPoints[0]!);

const isFullyExtended = computed(
  () => activeSnapPoint.value === snapPoints.at(-1),
);

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
let touchStartY = 0;
useEventListener(
  scroller,
  "touchstart",
  (e: TouchEvent) => {
    touchStartY = e.touches[0]!.clientY;
  },
  { passive: true },
);
useEventListener(
  scroller,
  "touchmove",
  (e: TouchEvent) => {
    if (isDesktop.value || !scroller.value) {
      return;
    }
    const isPullingDown = e.touches[0]!.clientY > touchStartY;
    if (isPullingDown && scroller.value.scrollTop <= 0 && e.cancelable) {
      e.preventDefault();
    }
  },
  { passive: false },
);

onKeyStroke("Escape", () => {
  // The drawer already handles close on Escape press, so this is only required on desktop
  if (isDesktop.value) {
    emit("close");
  }
});
</script>

<template>
  <UDrawer
    v-if="!isDesktop"
    open
    :title="title"
    v-model:activeSnapPoint="activeSnapPoint"
    :snapPoints="snapPoints"
    :modal="false"
    :overlay="false"
    portal="#main"
    :ui="{
      // For 'full' extension of the panel, stop 'a bit below the topbar' (half the topbar height),
      // so a bit of the map remains visible.
      // Leave 4rem space below for the footer.
      content: 'bottom-16 z-20 h-[calc(100%-1.5*var(--ui-header-height)-4rem)]',
      container: 'min-h-0 flex-1 gap-0 overflow-hidden p-0',
      // The theme spaces the handle for a padded container, which this is not
      handle: 'my-2',
      header: 'px-4 py-3',
      title: 'text-sm font-semibold text-highlighted uppercase',
      body: 'flex min-h-0 flex-1',
    }"
    @update:open="
      (isOpen) => {
        if (!isOpen) emit('close');
      }
    "
  >
    <template #body>
      <div ref="scroller" :class="scrollerClass">
        <slot />
      </div>
    </template>
  </UDrawer>

  <div v-else class="flex min-h-0 flex-1 flex-col">
    <div
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
    <div ref="scroller" :class="scrollerClass">
      <slot />
    </div>
  </div>
</template>
