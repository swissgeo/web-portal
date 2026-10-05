<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
const { embedCode } = defineProps<{
  embedCode: string;
  copied: boolean;
}>();

const zoomOnlyCtrl = defineModel("zoomOnlyCtrl");

const emit = defineEmits<{
  (_e: "copy"): void;
}>();

const value = ref("small");
const iframeTarget = useTemplateRef("iframeTarget");

const resolutions = {
  small: { width: 400, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
} as const;

const items = computed<SelectItem[]>(() => [
  {
    id: "small",
    label:
      "Klein " +
      (resolutions.small.width + " x " + resolutions.small.height + " Pixel"),
  },
  {
    id: "medium",
    label:
      "Mittel " +
      (resolutions.medium.width + " x " + resolutions.medium.height + " Pixel"),
  },
  {
    id: "large",
    label:
      "Gross " +
      (resolutions.large.width + " x " + resolutions.large.height + " Pixel"),
  },
]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 pt-space-xs">
      <p class="text-sm font-semibold text-highlighted">Karte einbetten</p>
      <p class="text-sm font-medium">
        Betten Sie die Karte mit dem Link in Ihre eigene Umgebung ein.
      </p>
    </div>
    <UFormField label="Grösse" class="w-full">
      <USelect
        v-model="value"
        value-key="id"
        :items="items"
        :ui="{
          base: 'w-full',
        }"
      />
    </UFormField>
    <UCheckbox
      label="Zoom nur mit der Ctrl/Cmd-Taste zulassen"
      @update:model-value="(value) => (zoomOnlyCtrl = value)"
    />
    <div class="relative flex h-64 w-full items-center justify-center bg-black">
      <div
        class="absolute top-0 left-0 flex h-full w-full items-center justify-center bg-black/20 text-sm font-semibold text-white"
      >
        {{
          value === "small"
            ? "400 x 300 Pixel"
            : value === "medium"
              ? "800 x 600 Pixel"
              : "1200 x 900 Pixel"
        }}
      </div>
      <div ref="iframeTarget"></div>
    </div>
    <UFormField label="Link" size="lg" class="w-full">
      <UInput
        icon="i-lucide-link"
        size="lg"
        color="neutral"
        variant="outline"
        :model-value="embedCode"
        readonly
      >
        <template #trailing>
          <UButton
            :color="copied ? 'success' : 'primary'"
            variant="solid"
            :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
            label="Kopieren"
            aria-label="Copy to clipboard"
            @click="emit('copy')"
          />
        </template>
      </UInput>
    </UFormField>
  </div>
</template>

<style scoped></style>
