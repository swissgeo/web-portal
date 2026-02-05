<script setup lang="ts">
// Adapted from web-mapviewer SearchResultList.vue

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SearchResult } from '@swissgeo/search'
import SearchCategory from './SearchCategory.vue'

const props = defineProps<{
    results: SearchResult[]
}>()

const emit = defineEmits<{
    select: [result: SearchResult]
    close: []
}>()

const { t } = useI18n()

const resultCategories = ref<InstanceType<typeof SearchCategory>[]>([])

// Separate results by type
const locationResults = computed(() =>
    props.results.filter((result) => result.resultType === 'LOCATION')
)

const layerResults = computed(() => props.results.filter((result) => result.resultType === 'LAYER'))

const featureResults = computed(() =>
    props.results.filter((result) => result.resultType === 'FEATURE')
)

// Create categories array
const categories = computed(() => {
    return [
        {
            id: 'locations',
            results: locationResults.value,
        },
        {
            id: 'features',
            results: featureResults.value,
        },
        {
            id: 'layers',
            results: layerResults.value,
        },
    ]
})

// Focus first entry
function focusFirstEntry() {
    const firstCategory = categories.value.findIndex((category) => category.results.length > 0)
    if (firstCategory >= 0 && resultCategories.value) {
        resultCategories.value[firstCategory]?.focusFirstEntry()
    }
}

// Handle navigation between categories
function onFirstEntryReached(index: number) {
    const previousCategoryIndex = categories.value.findLastIndex(
        (category, i) => i < index && category.results.length > 0
    )
    if (previousCategoryIndex >= 0 && resultCategories.value) {
        // Jump to previous category's last entry
        resultCategories.value[previousCategoryIndex]?.focusLastEntry()
    }
}

function onLastEntryReached(index: number) {
    const nextCategoryIndex = categories.value.findIndex(
        (category, i) => i > index && category.results.length > 0
    )
    if (nextCategoryIndex >= 0 && resultCategories.value) {
        // Jump to next category's first entry
        resultCategories.value[nextCategoryIndex]?.focusFirstEntry()
    }
}

// Handle result selection
function onEntrySelected(result: SearchResult) {
    emit('select', result)
    emit('close')
}

// Expose method for parent to call
defineExpose({ focusFirstEntry })
</script>

<template>
    <!-- Results container -->
    <div
        class="flex-1 overflow-y-auto"
        data-cy="search-results"
    >
        <SearchCategory
            v-for="(category, index) in categories"
            v-show="category.results.length > 0"
            :key="category.id"
            ref="resultCategories"
            :title="t(`search.${category.id}_results_header`)"
            :results="category.results"
            :data-cy="`search-results-${category.id}`"
            @select="onEntrySelected"
            @first-entry-reached="onFirstEntryReached(index)"
            @last-entry-reached="onLastEntryReached(index)"
        />
    </div>
</template>
