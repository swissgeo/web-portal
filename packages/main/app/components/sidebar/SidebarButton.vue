<script lang="ts" setup>
const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

defineProps<{
  title: string;
  isActive: boolean;
  iconName: string;
}>();
</script>

<template>
  <UButton
    :aria-label="title"
    color="primary"
    :icon="'i-lucide-' + iconName.toLowerCase()"
    :variant="isActive ? 'solid' : 'ghost'"
    square
    class="size-12 justify-center rounded-md"
    :title="title"
    :ui="{ leadingIcon: 'size-6' }"
    @click="emit('click', $event)"
  />
</template>
