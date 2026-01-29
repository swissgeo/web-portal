<script setup lang="ts">
// Adapted from web-mapviewer SearchResultListEntry.vue
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/viewer/src/modules/menu/components/search/SearchResultListEntry.vue

import { MapPin, Layers } from 'lucide-vue-next'
import { ref } from 'vue'

// Mock type for now (will use real SearchResult type later)
export interface SearchResultMock {
    id: string
    title: string
    description?: string
    resultType: 'LOCATION' | 'LAYER'
}

const props = defineProps<{
    index: number
    entry: SearchResultMock
}>()

const emit = defineEmits<{
    select: []
    firstEntryReached: []
    lastEntryReached: []
}>()

const item = ref<HTMLLIElement>()

// Keyboard navigation (from mapviewer lines 56-92)
function goToFirst() {
    if (!item.value) return
    const firstItem = item.value.parentElement?.firstElementChild as HTMLLIElement
    firstItem?.focus()
}

function goToPrevious() {
    if (!item.value) return
    if (item.value.previousElementSibling) {
        ;(item.value.previousElementSibling as HTMLLIElement).focus()
    } else {
        emit('firstEntryReached')
    }
}

function goToNext() {
    if (!item.value) return
    if (item.value.nextElementSibling) {
        ;(item.value.nextElementSibling as HTMLLIElement).focus()
    } else {
        emit('lastEntryReached')
    }
}

function goToLast() {
    if (!item.value?.parentElement) return
    const lastItem = item.value.parentElement.lastElementChild as HTMLLIElement
    lastItem?.focus()
}

// Selection handler (from mapviewer lines 49-54)
function selectItem() {
    emit('select')
}

// Expose methods for parent to call (from mapviewer lines 112-115)
defineExpose({
    goToFirst,
    goToLast,
})
</script>

<template>
    <!-- List item with keyboard navigation (from mapviewer lines 119-141) -->
    <li
        ref="item"
        class="flex cursor-pointer items-start gap-3 border-b border-surface-100 px-4 py-3 hover:bg-surface-50 transition-colors focus:outline-none focus:bg-surface-100"
        :data-cy="`search-result-entry-${entry.resultType.toLowerCase()}`"
        :tabindex="index === 0 ? 0 : -1"
        @keydown.up.prevent="goToPrevious"
        @keydown.down.prevent="goToNext"
        @keydown.home.prevent="goToFirst"
        @keydown.end.prevent="goToLast"
        @keyup.enter="selectItem"
        @click="selectItem"
    >
        <!-- Icon based on result type (adapted from mapviewer) -->
        <div class="mt-1 text-surface-400 flex-shrink-0">
            <MapPin v-if="entry.resultType === 'LOCATION'" :size="18" />
            <Layers v-else :size="18" />
        </div>

        <!-- Title and description (from mapviewer lines 134-141) -->
        <div class="flex-1 min-w-0">
            <!-- Title with HTML support for search highlighting -->
            <div class="font-medium text-surface-900" v-html="entry.title" />

            <!-- Description (optional) -->
            <div v-if="entry.description" class="mt-1 text-sm text-surface-600 truncate">
                {{ entry.description }}
            </div>
        </div>
    </li>
</template>
