<script setup lang="ts">
// Adapted from web-mapviewer SearchBar.vue
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/viewer/src/modules/menu/components/search/SearchBar.vue

import { ref, onMounted } from 'vue'
import { X, Search, LoaderCircle } from 'lucide-vue-next'
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
            <!-- Search icon (from mapviewer lines 159-166) -->
            <Search :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />

            <!-- Input field (from mapviewer lines 167-190) -->
            <InputText
                ref="searchInput"
                :model-value="modelValue"
                type="search"
                :placeholder="$t('search.placeholder')"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                class="w-full pl-10 pr-10"
                data-cy="searchbar"
                @input="onInput"
                @keydown="onKeydown"
            />

            <!-- Clear button (from mapviewer lines 201-212) -->
            <button
                v-if="modelValue"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                type="button"
                data-cy="searchbar-clear"
                @click="onClear"
            >
                <!-- Loading spinner when searching, X icon otherwise -->
                <LoaderCircle v-if="isSearching" :size="20" class="animate-spin" />
                <X v-else :size="20" />
            </button>
        </div>
    </div>
</template>

<style scoped>
/* Prevent browser's native clear button on search inputs (from mapviewer lines 227-230) */
input[type='search']::-webkit-search-cancel-button {
    appearance: none;
}
</style>
