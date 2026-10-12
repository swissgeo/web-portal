<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";

import { DEFAULT_RESOLUTION } from "~/composables/useCreateShareLink";
import { useI18n } from "vue-i18n";

import ShareEmbedPreview from "./ShareEmbedPreview.vue";

const { embedCode, embedUrl } = defineProps<{
  embedCode: string;
  embedUrl: string;
  copied: boolean;
}>();

const zoomOnlyCtrl = defineModel<boolean>("zoomOnlyCtrl", { default: false });
const fullWidth = defineModel<boolean>("fullWidth", { default: false });
const resolution = defineModel<{ width: number; height: number }>(
  "resolution",
  {
    default: () => ({ ...DEFAULT_RESOLUTION }),
  },
);

const emit = defineEmits<{
  (_e: "copy"): void;
}>();

const { t } = useI18n();

const sizeKey = ref<"small" | "medium" | "large" | "custom">("medium");

const resolutions = {
  small: { width: 400, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
} as const;

const MIN_DIMENSION = 200;
const MAX_DIMENSION = 4000;

const items = computed<SelectItem[]>(() => {
  const sizeOptions = [
    ["small", "toolbox.share.embed.sizeSmall"],
    ["medium", "toolbox.share.embed.sizeMedium"],
    ["large", "toolbox.share.embed.sizeLarge"],
    ["custom", "toolbox.share.embed.sizeCustom"],
  ] as const;

  return sizeOptions.map(([key, labelKey]) => {
    if (key === "custom") {
      return {
        id: key,
        label: `${t(labelKey)}`,
      };
    }
    const { width, height } = resolutions[key];
    return {
      id: key,
      label: `${t(labelKey)} (${width} × ${height})`,
    };
  });
});

function onSizeSelect(value: string) {
  sizeKey.value = value as typeof sizeKey.value;
  if (sizeKey.value === "custom") {
    return;
  }
  fullWidth.value = false;
  resolution.value = { ...resolutions[sizeKey.value] };
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_DIMENSION;
  }
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(value)));
}

function onWidthInput(value: unknown) {
  const width = Number(value);
  if (fullWidth.value || !Number.isFinite(width)) {
    return;
  }
  resolution.value = {
    ...resolution.value,
    width,
  };
}

function onWidthBlur() {
  resolution.value = {
    ...resolution.value,
    width: clampDimension(resolution.value.width),
  };
}

function onHeightInput(value: unknown) {
  const height = Number(value);
  if (!Number.isFinite(height)) {
    return;
  }
  resolution.value = {
    ...resolution.value,
    height,
  };
}

function onHeightBlur() {
  resolution.value = {
    ...resolution.value,
    height: clampDimension(resolution.value.height),
  };
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 pt-space-xs">
      <p class="text-sm font-semibold text-highlighted">
        {{ t("toolbox.share.embed.title") }}
      </p>
      <p class="text-sm font-medium">
        {{ t("toolbox.share.embed.description") }}
      </p>
    </div>
    <UFormField :label="t('toolbox.share.embed.sizeLabel')" class="w-full">
      <USelect
        :model-value="sizeKey"
        value-key="id"
        :items="items"
        data-testid="share-embed-size-select"
        :ui="{
          base: 'w-full',
        }"
        @update:model-value="onSizeSelect"
      />
    </UFormField>
    <div
      v-if="sizeKey === 'custom'"
      data-testid="share-embed-custom-fields"
      class="flex w-full flex-row justify-between gap-4"
    >
      <div class="flex w-full flex-col gap-2">
        <UFormField
          :label="t('toolbox.share.embed.customWidthLabel')"
          size="lg"
          class="w-full"
        >
          <UInput
            :model-value="fullWidth ? 100 : resolution.width"
            type="number"
            size="lg"
            color="neutral"
            variant="outline"
            :disabled="fullWidth"
            data-testid="share-embed-width-input"
            @update:model-value="onWidthInput"
            @blur="onWidthBlur"
          >
            <template #trailing>
              <span>{{
                !fullWidth ? t("toolbox.share.embed.pixelUnit") : "%"
              }}</span>
            </template>
          </UInput>
        </UFormField>
        <UCheckbox
          v-model="fullWidth"
          :label="t('toolbox.share.embed.fullWidthLabel')"
          data-testid="share-embed-full-width"
          :ui="{
            label: 'text-sm',
          }"
        />
      </div>
      <UFormField
        :label="t('toolbox.share.embed.customHeightLabel')"
        size="lg"
        class="w-full"
      >
        <UInput
          :model-value="resolution.height"
          type="number"
          size="lg"
          color="neutral"
          variant="outline"
          data-testid="share-embed-height-input"
          @update:model-value="onHeightInput"
          @blur="onHeightBlur"
        >
          <template #trailing>
            <span>{{ t("toolbox.share.embed.pixelUnit") }}</span>
          </template>
        </UInput>
      </UFormField>
    </div>
    <UCheckbox
      v-model="zoomOnlyCtrl"
      :label="t('toolbox.share.embed.zoomOnlyCtrlLabel')"
      :ui="{
        label: 'text-sm',
      }"
    />
    <ShareEmbedPreview
      :src="embedUrl"
      :resolution="resolution"
      :full-width="fullWidth"
    />
    <UFormField
      :label="t('toolbox.share.link.urlLabel')"
      size="lg"
      class="w-full"
    >
      <UInput
        icon="i-lucide-link"
        size="lg"
        color="neutral"
        variant="outline"
        :model-value="embedCode"
        readonly
        :ui="{
          trailing: 'pe-2',
        }"
      >
        <template #trailing>
          <UButton
            :color="copied ? 'success' : 'primary'"
            variant="solid"
            :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
            :label="t('toolbox.share.link.copyButton')"
            :aria-label="t('toolbox.share.link.ariaLabel.copyToClipboard')"
            data-testid="share-embed-copy"
            @click="emit('copy')"
          />
        </template>
      </UInput>
    </UFormField>
  </div>
</template>
