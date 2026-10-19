<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { computed } from "vue";

// UTooltip has no own element, so class and data-testid go to the button.
defineOptions({ inheritAttrs: false });

const { defaultIcon = "i-lucide-link", label } = defineProps<{
  url: string;
  label: string;
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
  <UTooltip :text="label" :content="{ side: 'top' }">
    <UButton
      :icon="icon"
      :class="{ 'text-success': copied }"
      color="primary"
      variant="ghost"
      :aria-label="label"
      data-testid="dataset-copy-link"
      v-bind="$attrs"
      @click="copy(url)"
    />
  </UTooltip>
</template>
