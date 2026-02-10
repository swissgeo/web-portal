<script setup lang="ts">
// Adapted from web-mapviewer SearchBar.vue

import InputText from 'primevue/inputtext'
import { onMounted, useTemplateRef } from 'vue'

import LucideIcon from '../../LucideIcon.vue'

const props = defineProps<{
    modelValue: string
    isSearching?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    clear: []
}>()

const searchInput = useTemplateRef<typeof InputText>('searchInput')

// Focus input on mount
onMounted(() => {
    if (searchInput.value) {
        // TODO
        // @ts-expect-error Doesn't make sense to fix now as primevue will go away
        searchInput.value.$el?.focus()
    }
})

// Handle input changes
const onInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update:modelValue', value)
}

// Clear search
const onClear = () => {
    emit('clear')
    if (searchInput.value) {
        // TODO
        // @ts-expect-error Doesn't make sense to fix now as primevue will go away
        searchInput.value.$el?.focus()
    }
}

// Handle escape key
const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue) {
        event.preventDefault()
        onClear()
    }
}
</script>

<template>
    <div class="border-b border-surface-200 p-4">
        <div class="relative">
            <!-- Input field -->
            <InputText
                ref="searchInput"
                :model-value="modelValue"
                type="text"
                :placeholder="$t('search.placeholder')"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                class="search-input w-full"
                data-cy="searchbar"
                @input="onInput"
                @keydown="onKeydown"
            />

            <!-- Clear button -->
            <button
                v-if="modelValue"
                class="absolute top-1/2 right-3 -translate-y-1/2 text-surface-400 transition-colors hover:text-surface-600"
                type="button"
                data-cy="searchbar-clear"
                @click="onClear"
            >
                <LucideIcon
                    v-if="isSearching"
                    name="LoaderCircle"
                    class="h-5 w-5 animate-spin"
                />
                <LucideIcon
                    v-else
                    name="X"
                    class="h-5 w-5"
                />
            </button>
        </div>
    </div>
</template>

<style scoped>
/* Prevent browser's native clear button on search inputs */
input[type='search']::-webkit-search-cancel-button {
    appearance: none;
}

/* Add padding for clear button - use :deep() to pierce into PrimeVue component */
:deep(.search-input) {
    padding-right: 2.5rem;
}
</style>
