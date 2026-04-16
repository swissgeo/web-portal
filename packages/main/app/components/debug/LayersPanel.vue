<script lang="ts" setup>
import type { Dataset } from '@swissgeo/ogc'

import { IconButton } from '@swissgeo/skeleton'

const { locale } = useI18n()

const filterTerm = ref<string>('')
// the composable will update the data if the locale changes
const { data: recordLayers } = useOgcCatalog(locale)

const availableLayers = computed(() => {
    return recordLayers.value
})

const filteredAvailableLayers = computed((): Dataset[] => {
    if (!availableLayers.value) {
        return []
    }

    if (filterTerm.value === '') {
        return availableLayers.value.records
    }
    return availableLayers.value.records.filter((layer: Dataset) =>
        layer.id.includes(filterTerm.value)
    )
})
</script>

<template>
    <div>
        <div class="absolute flex w-full items-center justify-between gap-4 px-2">
            <input
                v-model="filterTerm"
                class="w-full border border-gray-200 px-2 py-1"
                placeholder="Filter"
                autofocus
            />
            <IconButton
                @click="$emit('close')"
                iconName="X"
            >
            </IconButton>
        </div>
        <div class="mt-12 h-75 overflow-scroll pb-18">
            <table class="">
                <DebugLayersPanelEntry
                    :dataset="layer"
                    v-for="layer in filteredAvailableLayers"
                    :key="layer.id"
                />
            </table>
        </div>
    </div>
</template>
