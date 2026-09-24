<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { computed } from "vue";

const { defaultIcon = "i-lucide-link" } = defineProps<{
  url: string;
  defaultIcon?: string;
}>();

const { copy, copied } = useClipboard();
const icon = computed(() => {
  if (copied.value) {
    return "i-lucide-copy-check";
  }
  return defaultIcon;
});
</script>

<template>
  <UButton
    :icon="icon"
    :class="{ 'text-success': copied }"
    color="primary"
    variant="ghost"
    :aria-label="$t('toolbox.share.ariaLabel.copyToClipboard')"
    data-testid="dataset-copy-link"
    @click="copy(url)"
  />
</template>
