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
  <UButton
    :title="title"
    color="primary"
    variant="ghost"
    class="w-14 flex-col gap-0.5 px-1 py-1.5"
    :class="{
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
  </UButton>
</template>
