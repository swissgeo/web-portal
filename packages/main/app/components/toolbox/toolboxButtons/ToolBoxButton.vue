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
        :severity="isDisabled ? 'secondary' : isActive ? 'primary' : 'info'"
        :iconName="iconName"
        :title="title"
        :disabled="isDisabled"
        size="xl"
        @click="emit('click')"
        v-bind="$attrs"
    ></IconButton>
</template>

<style scoped></style>
