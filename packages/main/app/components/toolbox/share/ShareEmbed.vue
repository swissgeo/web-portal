<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";

import { useResizeObserver } from "@vueuse/core";
import { useI18n } from "vue-i18n";

const { embedCode, stateId } = defineProps<{
  embedCode: string;
  copied: boolean;
  stateId: string | null;
}>();

const zoomOnlyCtrl = defineModel<boolean>("zoomOnlyCtrl", { default: false });
const fullWidth = defineModel<boolean>("fullWidth", { default: false });
const resolution = defineModel<{ width: number; height: number }>(
  "resolution",
  {
    default: () => ({ width: 800, height: 600 }),
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
      const widthLabel = fullWidth.value
        ? "100%"
        : String(resolution.value.width);
      return {
        id: key,
        label: `${t(labelKey)} (${widthLabel} × ${resolution.value.height})`,
      };
    }
    const { width, height } = resolutions[key];
    return {
      id: key,
      label: `${t(labelKey)} (${width} × ${height})`,
    };
  });
});

watch(sizeKey, (key) => {
  if (key === "custom") {
    return;
  }
  fullWidth.value = false;
  resolution.value = { ...resolutions[key] };
});

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_DIMENSION;
  }
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(value)));
}

function onWidthBlur() {
  resolution.value = {
    ...resolution.value,
    width: clampDimension(resolution.value.width),
  };
}

function onHeightBlur() {
  resolution.value = {
    ...resolution.value,
    height: clampDimension(resolution.value.height),
  };
}

const previewBox = useTemplateRef("previewBox");
const boxSize = reactive({ width: 0, height: 0 });

useResizeObserver(previewBox, (entries) => {
  const entry = entries[0];
  if (!entry) {
    return;
  }
  boxSize.width = entry.contentRect.width;
  boxSize.height = entry.contentRect.height;
});

const previewSrc = computed(() => {
  if (!stateId) {
    return "";
  }
  const url = new URL("/embed", location.origin);
  url.searchParams.set("state", stateId);
  if (zoomOnlyCtrl.value) {
    url.searchParams.set("zoomOnlyCtrl", "true");
  }
  return url.href;
});

const PREVIEW_MARGIN = 16;

const scale = computed(() => {
  const { width, height } = resolution.value;
  if (!height || !boxSize.height) {
    return 1;
  }
  const availableHeight = Math.max(boxSize.height - PREVIEW_MARGIN * 2, 0);
  if (fullWidth.value) {
    return Math.min(availableHeight / height, 1);
  }
  if (!width || !boxSize.width) {
    return 1;
  }
  const availableWidth = Math.max(boxSize.width - PREVIEW_MARGIN * 2, 0);
  return Math.min(availableWidth / width, availableHeight / height, 1);
});

const iframeLogicalSize = computed(() => {
  const { width, height } = resolution.value;
  if (fullWidth.value && boxSize.width) {
    return { width: boxSize.width / scale.value, height };
  }
  return { width, height };
});

const scaledBoxStyle = computed(() => ({
  width: `${iframeLogicalSize.value.width * scale.value}px`,
  height: `${iframeLogicalSize.value.height * scale.value}px`,
}));

const iframeStyle = computed(() => ({
  width: `${iframeLogicalSize.value.width}px`,
  height: `${iframeLogicalSize.value.height}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: "top left",
}));
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
        v-model="sizeKey"
        value-key="id"
        :items="items"
        data-testid="share-embed-size-select"
        :ui="{
          base: 'w-full',
        }"
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
            v-model.number="resolution.width"
            type="number"
            size="lg"
            color="neutral"
            variant="outline"
            :disabled="fullWidth"
            data-testid="share-embed-width-input"
            @blur="onWidthBlur"
          >
            <template #trailing>
              <span>{{ t("toolbox.share.embed.pixelUnit") }}</span>
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
          v-model.number="resolution.height"
          type="number"
          size="lg"
          color="neutral"
          variant="outline"
          data-testid="share-embed-height-input"
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
    <div
      ref="previewBox"
      data-testid="share-embed-preview"
      class="relative h-64 w-full overflow-hidden bg-black"
    >
      <div
        class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] overflow-hidden"
        :style="scaledBoxStyle"
      >
        <iframe
          v-if="previewSrc"
          :src="previewSrc"
          :style="iframeStyle"
          frameborder="0"
          class="border-0"
          data-testid="share-embed-preview-iframe"
        />
      </div>
      <div
        data-testid="share-embed-preview-label"
        class="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-semibold text-white"
      >
        {{
          fullWidth
            ? `100% × ${resolution.height}`
            : `${resolution.width} × ${resolution.height}`
        }}
      </div>
    </div>
    <UFormField label="Link" size="lg" class="w-full">
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
            label="Kopieren"
            aria-label="Copy to clipboard"
            data-testid="share-embed-copy"
            @click="emit('copy')"
          />
        </template>
      </UInput>
    </UFormField>
  </div>
</template>

<style scoped></style>
