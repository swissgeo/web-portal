<script lang="ts" setup>
import { useAttrs, computed } from 'vue'

import LucideIcon from '@/components/LucideIcon.vue'

const attrs = useAttrs()

// Map severity to color for NuxtUI
const severityToColor = {
    primary: 'primary',
    secondary: 'gray',
    success: 'green',
    info: 'blue',
    warning: 'yellow',
    danger: 'red',
} as const

// Compute color from severity prop, default to gray
const color = computed(() => {
    const severity = attrs.severity as string | undefined
    return severity ? severityToColor[severity as keyof typeof severityToColor] || 'gray' : 'gray'
})

// Compute variant - if 'text' prop is true, use 'ghost'
const variant = computed(() => {
    return attrs.text ? 'ghost' : 'solid'
})

// Get icon name and class
const iconName = computed(() => (attrs.icon as string) ?? '')
const iconClass = computed(() => attrs['icon-class'] || '')

// Get other attrs excluding the ones we're handling specially
const buttonAttrs = computed(() => {
    const rest = { ...attrs }
    delete rest.severity
    delete rest.text
    delete rest.icon
    delete rest['icon-class']
    return rest
})
</script>

<template>
    <UButton
        :color="color"
        :variant="variant"
        v-bind="buttonAttrs"
    >
        <template #leading>
            <LucideIcon
                :class="iconClass"
                :name="iconName"
            />
        </template>
    </UButton>
</template>
