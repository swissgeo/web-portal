<script setup lang="ts">
const {
  disabled = false,
  icon,
  label,
  size = "small",
  tone = "muted",
} = defineProps<{
  disabled?: boolean;
  icon: string;
  label: string;
  size?: "small" | "medium";
  tone?: "danger" | "highlighted" | "muted";
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <UButton
    type="button"
    color="neutral"
    variant="ghost"
    square
    :icon="icon"
    :aria-label="label"
    :disabled="disabled"
    :title="label"
    class="shrink-0 justify-center rounded-sm bg-transparent p-0 transition-colors outline-none hover:bg-transparent hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
    :class="[
      size === 'medium' ? 'size-5' : 'size-4',
      tone === 'highlighted' && 'text-highlighted',
      tone === 'muted' && 'text-muted',
      tone === 'danger' && 'text-muted hover:text-error',
    ]"
    :ui="{
      leadingIcon: size === 'medium' ? 'size-5' : 'size-4',
    }"
    @click="emit('click', $event)"
  />
</template>
