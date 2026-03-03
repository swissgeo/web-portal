<script lang="ts" setup>
import { IconButton } from '@swissgeo/skeleton'

const emit = defineEmits(['click'])

const { title } = defineProps<{
    title: string
    isActive: boolean
    isDisabled: boolean
    iconName: string
}>()
</script>

<template>
    <IconButton
        :severity="isDisabled ? 'secondary' : isActive ? 'primary' : 'success'"
        :icon-class="{ 'text-inverted': isActive, 'text-default': !isActive }"
        :text="!isActive"
        :iconName="iconName"
        :title="title"
        :class="{ 'text-inverted': isActive, 'text-default': !isActive }"
        size="xl"
        @click="emit('click')"
    ></IconButton>
</template>
