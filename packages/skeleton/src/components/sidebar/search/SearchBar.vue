<script setup lang="ts">
// Adapted from web-mapviewer SearchBar.vue
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/viewer/src/modules/menu/components/search/SearchBar.vue

import { ref, onMounted } from 'vue'
import { X, LoaderCircle } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'

const props = defineProps<{
    modelValue: string
    isSearching?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    clear: []
}>()

const searchInput = ref<InstanceType<typeof InputText>>()

// Focus input on mount (from mapviewer lines 53-58)
onMounted(() => {
    if (searchInput.value) {
        searchInput.value.$el?.focus()
    }
})

// Handle input changes (from mapviewer updateSearchQuery)
const onInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update:modelValue', value)
}

// Clear search (from mapviewer clearSearchQuery lines 85-93)
const onClear = () => {
    emit('clear')
    if (searchInput.value) {
        searchInput.value.$el?.focus()
    }
}

// Handle escape key (from mapviewer line 188)
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
            <!-- Input field (from mapviewer lines 167-190) -->
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

            <!-- Clear button (from mapviewer lines 201-212) -->
            <button
                v-if="modelValue"
                class="absolute top-1/2 right-3 -translate-y-1/2 text-surface-400 transition-colors hover:text-surface-600"
                type="button"
                data-cy="searchbar-clear"
                @click="onClear"
            >
                <!-- Loading spinner when searching, X icon otherwise -->
                <LoaderCircle
                    v-if="isSearching"
                    :size="20"
                    class="animate-spin"
                />
                <X
                    v-else
                    :size="20"
                />
            </button>
        </div>
    </div>
</template>

<style scoped>
/* Prevent browser's native clear button on search inputs (from mapviewer lines 227-230) */
input[type='search']::-webkit-search-cancel-button {
    appearance: none;
}

/* Add padding for clear button - use :deep() to pierce into PrimeVue component */
:deep(.search-input) {
    padding-right: 2.5rem;
}
</style>
