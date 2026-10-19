<script lang="ts" setup>
import { useDraggable, useWindowSize } from "@vueuse/core";

import FeatureInfo from "@/components/featuresinfo/FeatureInfo.vue";

const { t } = useI18n();

const POPUP_WIDTH_DESKTOP = 384; // w-96 / 24rem
const TOP_OFFSET_PX = 80; // 5rem from the top
const RIGHT_GAP_MOBILE_PX = 32; // 2rem from the right on mobile
const RIGHT_GAP_DESKTOP_PX = 96; // 6rem from the right on desktop, leaving room for the toolbox

const draggableContainer = useTemplateRef("container");
const dragHandle = useTemplateRef<HTMLDivElement>("dragHandle");
const isDesktop = useIsDesktop();

const { width: windowWidth, height: windowHeight } = useWindowSize();

let wasDragged = false;

const { x, y, style } = useDraggable(draggableContainer, {
  handle: dragHandle,
  onStart: (_position, event) => {
    if ((event.target as HTMLElement).closest("button")) {
      return false;
    }
    wasDragged = true;
  },
});

function positionAtTopRight() {
  const rightGap = isDesktop.value ? RIGHT_GAP_DESKTOP_PX : RIGHT_GAP_MOBILE_PX;
  const popupWidth = Math.min(
    POPUP_WIDTH_DESKTOP,
    windowWidth.value - 2 * RIGHT_GAP_MOBILE_PX,
  );
  y.value = TOP_OFFSET_PX;
  x.value = Math.max(windowWidth.value - rightGap - popupWidth, 8);
}

onMounted(positionAtTopRight);
watch([windowWidth, windowHeight], () => {
  if (!wasDragged) {
    positionAtTopRight();
  }
});

const emit = defineEmits<{
  close: [];
}>();
const isCollapsed = ref(false);
function toggleContent() {
  isCollapsed.value = !isCollapsed.value;
}
</script>
<template>
  <div
    ref="container"
    class="fixed z-50 w-96 max-w-[calc(100vw-4rem)]"
    :style="style"
    data-testid="feature-info-popover"
  >
    <UCard
      :ui="{
        header: 'cursor-grab active:cursor-grabbing select-none',
        body: 'max-h-[40vh]',
      }"
    >
      <template #header>
        <div
          ref="dragHandle"
          class="flex items-center justify-between"
          data-testid="feature-info-popover-header"
        >
          <span class="font-semibold text-highlighted">{{
            t("featureInfo.popupTitle")
          }}</span>
          <UButton
            :icon="
              isCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'
            "
            color="neutral"
            variant="ghost"
            square
            size="xs"
            data-testid="feature-info-popover-collapse"
            @click="toggleContent"
          /><UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            square
            size="xs"
            data-testid="feature-info-popover-close"
            @click="emit('close')"
          />
        </div>
      </template>
      <div v-show="!isCollapsed"><FeatureInfo /></div>
    </UCard>
  </div>
</template>
