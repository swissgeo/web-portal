<script lang="ts" setup>
const emit = defineEmits(["click"]);

const { title } = defineProps<{
  title: string;
  isActive: boolean;
  icon: string;
}>();
</script>

<template>
    <IconButton
        :severity="isActive ? 'primary' : 'secondary'"
        class="h-10"
        :icon-class="{ 'text-white': isActive, 'w-5 text-cyan-900': true }"
        :text="!isActive"
        :title="title"
        :icon="icon"
        @click="emit('click')"
    ></IconButton>
</template>
