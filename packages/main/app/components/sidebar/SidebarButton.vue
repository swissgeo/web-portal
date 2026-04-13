<script lang="ts" setup>
import { IconButton } from '@swissgeo/skeleton'

const emit = defineEmits(['click'])

const { title } = defineProps<{
    title: string
    isActive: boolean
    iconName: string
}>()
</script>

<template>
    <IconButton
        :severity="isActive ? 'primary' : 'secondary'"
        class="h-10"
        :icon-class="{ 'text-white': isActive, 'w-5 text-cyan-900': true }"
        :text="!isActive"
        :title="title"
        :iconName="iconName"
        @click="emit('click')"
    ></IconButton>
</template>
