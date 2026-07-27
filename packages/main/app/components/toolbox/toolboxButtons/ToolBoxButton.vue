<script lang="ts" setup>
const emit = defineEmits(["click"]);

const { title } = defineProps<{
  title: string;
  isActive: boolean;
  isDisabled: boolean;
  iconName: string;
}>();
</script>

<template>
  <button
    :title="title"
    class="text-foreground/80 flex w-20 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-50"
    :class="{
      'cursor-pointer': !isDisabled,
      'bg-primary/10 text-primary': isActive,
    }"
    :disabled="isDisabled"
    @click="emit('click')"
  >
    <UIcon
      v-if="iconName"
      :name="`i-lucide-${iconName.toLowerCase()}`"
      :size="20"
    />
    <span class="text-[10px] leading-tight font-medium">{{ title }}</span>
  </button>
</template>

<style scoped></style>
