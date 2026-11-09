<script lang="ts" setup>
const emit = defineEmits(["click"]);

const { title } = defineProps<{
  title: string;
  isActive: boolean;
  isDisabled: boolean;
  iconName: string;
  iconOnly?: boolean;
}>();
</script>

<template>
  <UButton
    :title="title"
    :aria-label="iconOnly ? title : undefined"
    color="primary"
    variant="ghost"
    :size="iconOnly ? 'sm' : 'md'"
    class="hover:bg-primary-50/50 dark:hover:bg-primary-950 dark:hover:text-primary dark:disabled:text-dimmed"
    :class="{
      'w-14 flex-col gap-0.5 px-1 py-1.5': !iconOnly,
      'bg-primary-50 text-primary dark:bg-(--ui-color-accent-700) dark:text-accent-active':
        isActive,
    }"
    :disabled="isDisabled"
    @click="emit('click')"
  >
    <UIcon
      v-if="iconName"
      mode="svg"
      :name="`i-lucide-${iconName.toLowerCase()}`"
      :size="20"
    />
    <span v-if="!iconOnly" class="text-[10px] leading-tight font-medium">{{
      title
    }}</span>
  </UButton>
</template>
