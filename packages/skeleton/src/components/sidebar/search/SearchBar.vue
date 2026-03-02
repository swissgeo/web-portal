<script setup lang="ts">
// Adapted from web-mapviewer SearchBar.vue

import { ref } from 'vue'

import LucideIcon from '../../LucideIcon.vue'

const props = defineProps<{
    modelValue: string
    isSearching?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    clear: []
}>()

const searchInput = ref<HTMLInputElement>()

// Handle input changes
const onInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update:modelValue', value)
}

// Clear search
const onClear = () => {
    emit('clear')
    searchInput.value?.focus()
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
    <div class="border-b border-gray-200 p-4">
        <div class="relative">
            <!-- Input field -->
            <UInput
                ref="searchInput"
                :model-value="modelValue"
                type="text"
                :placeholder="$t('search.placeholder')"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                size="md"
                color="gray"
                variant="outline"
                class="w-full"
                :ui="{ icon: { trailing: { pointer: '' } } }"
                data-cy="searchbar"
                @input="onInput"
                @keydown="onKeydown"
                autofocus
            >
                <template #trailing>
                    <!-- Clear/Loading button -->
                    <!-- TODO: IconButtons instead -->

                    <button
                        v-if="modelValue"
                        class="text-gray-400 transition-colors hover:text-gray-600"
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
                </template>
            </UInput>
        </div>
    </div>
</template>

<style scoped>
/* Prevent browser's native clear button on search inputs */
input[type='search']::-webkit-search-cancel-button {
    appearance: none;
}
</style>
