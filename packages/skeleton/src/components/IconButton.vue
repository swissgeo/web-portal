<script lang="ts" setup>
import { useAttrs, computed } from 'vue'

const attrs = useAttrs()

// Map severity to color for NuxtUI --> WE DON'T CARE, WE ONLY GIVE SEVERITY
const severities = ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'neutral']

// Compute color from severity prop, default to gray
const color = computed(() => {
    if (attrs.severity && severities.includes(attrs.severity as string)) {
        return attrs.severity
    }
    return 'secondary'
})

// Compute variant - if 'text' prop is true, use 'ghost'
const variant = computed(() => {
    return attrs.text ? 'ghost' : 'solid'
})

// Get icon name and class
//const iconClass = computed(() => attrs['icon-class'] || '')

// Get other attrs excluding the ones we're handling specially
const buttonAttrs = computed(() => {
    const rest = { ...attrs }
    delete rest.severity
    delete rest.text
    // If needed : there is a "trailing-icon" property, that behaves like icon.
    // but puts the icon at the end of the button instead of the beginning if
    // we have text within the icon at some point.
    rest.icon = rest.iconName ? `i-lucide-${rest.iconName}`.toLowerCase() : ''
    return rest
})
</script>

<template>
    <UButton
        :color="color"
        :class="{
            'text-default': ['secondary', 'success', 'info', 'warning'].includes(color as string),
            'text-inverted': ['primary', 'danger', 'neutral'].includes(color as string),
        }"
        :variant="variant"
        v-bind="buttonAttrs"
        :data-testid="(buttonAttrs.icon as string).toLowerCase()"
    />
</template>
