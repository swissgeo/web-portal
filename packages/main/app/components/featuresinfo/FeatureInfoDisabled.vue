<script lang="ts" setup>
import { useElementSize, useWindowSize } from "@vueuse/core";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  initialPosition: { x: number; y: number };
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const { cmsUrl } = useCmsUrl();

const notice = useTemplateRef<HTMLDivElement>("notice");
const { width, height } = useElementSize(notice);
const { width: windowWidth, height: windowHeight } = useWindowSize();

const isDesktop = useIsDesktop();

const MARGIN = 16;
// On a phone the footer navigation (4rem) covers the bottom of the screen
const MOBILE_FOOTER_HEIGHT = 64;

const style = computed(() => {
  const bottom = isDesktop.value ? MARGIN : MARGIN + MOBILE_FOOTER_HEIGHT;
  return {
    left: `${Math.max(MARGIN, Math.min(props.initialPosition.x, windowWidth.value - width.value - MARGIN))}px`,
    top: `${Math.max(MARGIN, Math.min(props.initialPosition.y, windowHeight.value - height.value - bottom))}px`,
  };
});
</script>

<template>
  <div
    ref="notice"
    class="fixed z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md bg-default px-2 py-1 text-xs font-medium text-highlighted shadow-lg ring-1 ring-default"
    :style="style"
    data-testid="feature-info-disabled"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p>{{ t("featureInfo.featureFlag.notAvailable") }}</p>
        <UButton
          :to="cmsUrl(t('toolbox.featureFlag.links.roadmap'))"
          variant="link"
          size="xs"
          target="_blank"
          class="mt-2"
          :ui="{
            base: 'p-0',
          }"
        >
          {{ t("featureInfo.featureFlag.workingOnIt") }}
        </UButton>
      </div>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        square
        size="xs"
        data-testid="feature-info-disabled-close"
        @click="emit('close')"
      />
    </div>
  </div>
</template>
