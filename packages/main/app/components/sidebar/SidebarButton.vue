<script lang="ts" setup>
const emit = defineEmits(["click"]);

const { title } = defineProps<{
  title: string;
  isActive: boolean;
  iconName: string;
}>();
</script>

<template>
  <UButton
    color="primary"
    :variant="isActive ? 'solid' : 'ghost'"
    class="h-10"
    :title="title"
    :icon="`i-lucide-${iconName.toLowerCase()}`"
    @click="emit('click')"
  />
</template>
