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
  <button
    type="button"
    :aria-label="label"
    :disabled="disabled"
    :title="label"
    class="inline-flex shrink-0 items-center justify-center rounded-sm bg-transparent transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
    :class="[
      size === 'medium' ? 'size-5' : 'size-4',
      tone === 'highlighted' && 'text-highlighted',
      tone === 'muted' && 'text-muted',
      tone === 'danger' && 'text-muted hover:text-error',
    ]"
    @click="emit('click', $event)"
  >
    <UIcon
      :name="icon"
      aria-hidden="true"
      :class="size === 'medium' ? 'size-5' : 'size-4'"
    />
  </button>
</template>
