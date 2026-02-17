<script setup lang="ts">
// Adapted from web-mapviewer SearchResultListEntry.vue

import type { SearchResult } from '@swissgeo/search'

import { MapPin, Layers } from 'lucide-vue-next'
import { ref } from 'vue'

const { index, entry } = defineProps<{
    index: number
    entry: SearchResult
}>()

const emit = defineEmits<{
    select: []
    firstEntryReached: []
    lastEntryReached: []
}>()

const item = ref<HTMLLIElement>()

// Keyboard navigation
function goToFirst() {
    if (!item.value) {
        return
    }
    const firstItem = item.value.parentElement?.firstElementChild as HTMLLIElement
    firstItem?.focus()
}

function goToPrevious() {
    if (!item.value) {
        return
    }
    if (item.value.previousElementSibling) {
        ;(item.value.previousElementSibling as HTMLLIElement).focus()
    } else {
        emit('firstEntryReached')
    }
}

function goToNext() {
    if (!item.value) {
        return
    }
    if (item.value.nextElementSibling) {
        ;(item.value.nextElementSibling as HTMLLIElement).focus()
    } else {
        emit('lastEntryReached')
    }
}

function goToLast() {
    if (!item.value?.parentElement) {
        return
    }
    const lastItem = item.value.parentElement.lastElementChild as HTMLLIElement
    lastItem?.focus()
}

// Selection handler
function selectItem() {
    emit('select')
}

// Expose methods for parent to call
defineExpose({
    goToFirst,
    goToLast,
})
</script>

<template>
    <!-- List item with keyboard navigation -->
    <li
        ref="item"
        class="border-surface-100 hover:bg-surface-50 focus:bg-surface-100 flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors focus:outline-none"
        :data-cy="`search-result-entry-${entry.resultType.toLowerCase()}`"
        :tabindex="index === 0 ? 0 : -1"
        @keydown.up.prevent="goToPrevious"
        @keydown.down.prevent="goToNext"
        @keydown.home.prevent="goToFirst"
        @keydown.end.prevent="goToLast"
        @keyup.enter="selectItem"
        @click="selectItem"
    >
        <!-- Icon based on result type -->
        <div class="text-surface-400 mt-1 flex-shrink-0">
            <MapPin
                v-if="entry.resultType === 'LOCATION'"
                :size="18"
            />
            <Layers
                v-else
                :size="18"
            />
        </div>

        <!-- Title and description -->
        <div class="min-w-0 flex-1">
            <!-- Title with HTML support for search highlighting -->
            <div
                class="text-surface-900 font-medium"
                v-html="entry.title"
            />

            <!-- Description (optional) -->
            <div
                v-if="entry.description"
                class="text-surface-600 mt-1 truncate text-sm"
            >
                {{ entry.description }}
            </div>
        </div>
    </li>
</template>
