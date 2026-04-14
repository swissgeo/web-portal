<script lang="ts" setup>
import type { Dataset, DistributionCollection } from '@swissgeo/ogc'

import { DatasetViewContent } from '@swissgeo/skeleton'

const route = useRoute()
const { locale } = useI18n()
const runtimeConfig = useRuntimeConfig()

const id = computed(() => route.params.id as string)

const { data: dataset, error: datasetError } = await useAsyncData<Dataset>(
    `dataset-${id.value}`,
    () =>
        $fetch<Dataset>(
            `${runtimeConfig.public.ogcApiEndpoint}/items/${id.value}?language=${locale.value}`
        )
)

const { data: distributionCollection } = await useAsyncData<DistributionCollection | null>(
    `dataset-distributions-${id.value}`,
    async () => {
        const distributionsLink = dataset.value?.links?.find((l) => l.rel === 'distributions')
        if (!distributionsLink?.href) {
            return null
        }
        return $fetch<DistributionCollection>(`${distributionsLink.href}?language=${locale.value}`)
    }
)

useSeoMeta({
    title: dataset.value?.properties.title,
    description: dataset.value?.properties.description,
})
</script>

<template>
    <div class="mx-auto max-w-3xl px-4 py-8">
        <div
            v-if="datasetError"
            class="flex items-center justify-center text-sm text-red-500"
        >
            {{ datasetError.message }}
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
