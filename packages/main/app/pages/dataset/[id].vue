<script lang="ts" setup>
import { DatasetViewContent } from '@swissgeo/skeleton'

const route = useRoute()

const id = computed(() => route.params.id as string)

const { dataset, distributionCollection, error } = await useDatasetRecord(id)

useSeoMeta({
    title: dataset.value?.properties.title,
    description: dataset.value?.properties.description,
})
</script>

<template>
    <div class="mx-auto max-w-3xl px-4 py-8">
        <div
            v-if="error"
            class="flex items-center justify-center text-sm text-red-500"
        >
            {{ error.message }}
        </div>

        <template v-else-if="dataset">
            <h1 class="mb-8 text-2xl font-bold">
                {{ dataset.properties.title }}
            </h1>

            <DatasetViewContent
                :dataset="dataset"
                :distribution-collection="distributionCollection ?? null"
            />
        </template>
    </div>
</template>
