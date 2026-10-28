<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const props = defineProps<{
  initialPosition?: { x: number; y: number };
}>();

const { t } = useI18n();
const { cmsUrl } = useCmsUrl();

const style = computed(() => ({
  left: `${props.initialPosition?.x ?? 200}px`,
  top: `${props.initialPosition?.y ?? 200}px`,
}));
</script>

<template>
  <div
    class="light fixed z-50 overflow-hidden rounded-md bg-default px-2 py-1 text-xs font-medium text-highlighted shadow-lg ring-1 ring-default"
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
