<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { computed } from "vue";

defineProps<{ url: string }>();

const { copy, copied } = useClipboard();
const icon = computed(() => {
  if (copied.value) {
    return "i-lucide-copy-check";
  }
  return "i-lucide-link";
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
