<script lang="ts" setup>
import { IconButton } from "@swissgeo/skeleton";

const emit = defineEmits(["click"]);

const { title } = defineProps<{
  title: string;
  isActive: boolean;
  iconName: string;
}>();
</script>

<template>
  <IconButton
    color="primary"
    :variant="isActive ? 'solid' : 'ghost'"
    class="h-10"
    :title="title"
    :iconName="iconName"
    @click="emit('click')"
  ></IconButton>
</template>
