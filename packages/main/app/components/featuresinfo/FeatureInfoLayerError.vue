<script lang="ts" setup>
// Shown instead of the features of a layer whose features could not be loaded
const { t } = useI18n();
</script>

<template>
  <UPopover mode="hover" enable-touch>
    <button
      type="button"
      class="cursor-pointer self-start"
      data-testid="feature-info-layer-error"
    >
      <ErrorPill>{{ t("featureInfo.layerError") }}</ErrorPill>
    </button>
    <template #content>
      <p class="max-w-64 px-2 py-1 text-xs font-medium text-highlighted">
        {{ t("featureInfo.layerErrorDetail") }}
      </p>
    </template>
  </UPopover>
</template>
