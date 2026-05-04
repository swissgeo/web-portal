<script lang="ts" setup>
import { useAttrs, computed } from 'vue'

// we need to de-activate the automatic attribute passing to stop the computed values to be overriden by the attrs.
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

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

const icon = computed(() => {
    // If needed : there is a "trailing-icon" property, that behaves like icon.
    // but puts the icon at the end of the button instead of the beginning if
    // we have text within the icon at some point.
    return attrs.iconName ? `i-lucide-${attrs.iconName as string}`.toLowerCase() : ''
})
// Get other attrs excluding the ones we're handling specially
const buttonAttrs = computed(() => {
    const rest = { ...attrs }
    delete rest.icon
    delete rest.variant
    delete rest.color
    delete rest['data-testid']
    return rest
})
//        v-bind="buttonAttrs"
</script>

<template>
    <UButton
        :class="{
            'text-default': ['secondary', 'info', 'warning', 'neutral'].includes(color as string),
            'text-inverted': ['primary', 'danger', 'success'].includes(color as string),
            'cursor-pointer': true,
        }"
        :color="color"
        :variant="variant"
        :data-testid="`button-icon-${icon}`"
        :icon="icon"
        v-bind="buttonAttrs"
    />
</template>
