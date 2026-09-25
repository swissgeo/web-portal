<script setup lang="ts">
import type { RelativePlacement } from "@swissgeo/drawing";

const props = defineProps<{
  placement: RelativePlacement;
}>();

const emit = defineEmits<{
  "placement-selected": [placement: RelativePlacement];
}>();
</script>

<template>
  <div class="mb-3 grid grid-cols-3 gap-2">
    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'north-west',
      }"
      @click="emit('placement-selected', 'north-west')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'north',
      }"
      @click="emit('placement-selected', 'north')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'north-east',
      }"
      @click="emit('placement-selected', 'north-east')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'west',
      }"
      @click="emit('placement-selected', 'west')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'center',
      }"
      @click="emit('placement-selected', 'center')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'east',
      }"
      @click="emit('placement-selected', 'east')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'south-west',
      }"
      @click="emit('placement-selected', 'south-west')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'south',
      }"
      @click="emit('placement-selected', 'south')"
    ></div>

    <div
      class="flex aspect-square w-full items-center justify-center bg-gray-200"
      :class="{
        'bg-gray-400': props.placement === 'south-east',
      }"
      @click="emit('placement-selected', 'south-east')"
    ></div>
  </div>
</template>
