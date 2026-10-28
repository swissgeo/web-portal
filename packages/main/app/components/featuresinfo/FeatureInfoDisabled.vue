<script lang="ts" setup>
import { useElementSize, useWindowSize } from "@vueuse/core";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  initialPosition: { x: number; y: number };
}>();

const { t } = useI18n();
const { cmsUrl } = useCmsUrl();

const notice = useTemplateRef<HTMLDivElement>("notice");
const { width, height } = useElementSize(notice);
const { width: windowWidth, height: windowHeight } = useWindowSize();

const style = computed(() => ({
  left: `${Math.min(props.initialPosition.x, windowWidth.value - width.value)}px`,
  top: `${Math.min(props.initialPosition.y, windowHeight.value - height.value)}px`,
}));
</script>

<template>
  <div
    ref="notice"
    class="light fixed z-50 w-96 overflow-hidden rounded-md bg-default px-2 py-1 text-xs font-medium text-highlighted shadow-lg ring-1 ring-default"
    :style="style"
    data-testid="feature-info-disabled"
  >
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
</template>
