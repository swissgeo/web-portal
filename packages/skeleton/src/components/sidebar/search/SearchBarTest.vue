<script setup lang="ts">
// Temporary test component for SearchBar
import { ref } from 'vue'
import SearchBar from './SearchBar.vue'

const searchQuery = ref('')
const isSearching = ref(false)

const handleInput = (value: string) => {
    console.log('Search input:', value)
    searchQuery.value = value

    // Simulate searching
    isSearching.value = true
    setTimeout(() => {
        isSearching.value = false
    }, 500)
}

const handleClear = () => {
    console.log('Search cleared')
    searchQuery.value = ''
}
</script>

<template>
    <div class="w-[400px] bg-white">
        <h3 class="p-4 font-bold">SearchBar Test</h3>

        <SearchBar
            :model-value="searchQuery"
            :is-searching="isSearching"
            @update:model-value="handleInput"
            @clear="handleClear"
        />

        <div class="p-4">
            <p class="text-sm text-surface-600">Current value: "{{ searchQuery }}"</p>
            <p class="text-sm text-surface-600">Searching: {{ isSearching }}</p>
        </div>
    </div>
</template>
