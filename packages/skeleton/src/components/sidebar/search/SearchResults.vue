<script setup lang="ts">
// Adapted from web-mapviewer SearchResultList.vue
// Original: /home/ismailsunni/dev/c2c/web-mapviewer/packages/viewer/src/modules/menu/components/search/SearchResultList.vue

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

// Separate results by type (from mapviewer lines 39-47)
const locationResults = computed(() =>
    props.results.filter((result) => result.resultType === 'LOCATION')
)

const layerResults = computed(() => props.results.filter((result) => result.resultType === 'LAYER'))

const featureResults = computed(() =>
    props.results.filter((result) => result.resultType === 'FEATURE')
)

// Create categories array (from mapviewer lines 49-64)
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

// Focus first entry (from mapviewer lines 66-72)
function focusFirstEntry() {
    const firstCategory = categories.value.findIndex((category) => category.results.length > 0)
    if (firstCategory >= 0 && resultCategories.value) {
        resultCategories.value[firstCategory]?.focusFirstEntry()
    }
}

// Handle navigation between categories (from mapviewer lines 74-97)
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

// Handle result selection (from mapviewer line 183)
function onEntrySelected(result: SearchResult) {
    emit('select', result)
    emit('close')
}

// Expose method for parent to call (from mapviewer line 153)
defineExpose({ focusFirstEntry })
</script>

<template>
    <!-- Results container (from mapviewer lines 156-191) -->
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
