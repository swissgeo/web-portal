<!-- eslint multi-word: off-->
<script lang="ts" setup>
import type { SearchResult } from '@swissgeo/search'

import log from '@swissgeo/log'
import { SideBar } from '@swissgeo/skeleton'

import { useSearchSelection } from '@/composables/useSearchSelection'

const route = useRoute()

watch(route, (value) => {
    log.debug('route changed', value.fullPath)
})

// Handle search result selection
const { handleResultSelection } = useSearchSelection()

async function onSearchResultSelected(result: SearchResult) {
    await handleResultSelection(result)
}
</script>

<template>
    <main
        ref="main"
        class="font-sans"
    >
        <div class="relative h-screen">
            <SideBar
                class="z-2"
                @search-result-selected="onSearchResultSelected"
            />
            <div class="h-full w-full pl-20">
                <slot />
            </div>
        </div>
    </main>
</template>
