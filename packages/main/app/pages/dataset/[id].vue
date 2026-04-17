<script lang="ts" setup>
import type { NuxtError } from '#app'

import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import log from '@swissgeo/log'

const route = useRoute()
const localePath = useLocalePath()

const id = computed(() => route.params.id as string)

const { dataset, distributionCollection, error, promise } = useDatasetRecord(id)

function maybeShowError(e: NuxtError | undefined) {
    if (!e) {
        return
    }
    showError({ status: e.status ?? 404, fatal: true })
}

// On SSR:
// await the useAsyncData promise directly so we check the error
// only after the fetch has fully resolved, onServerPrefetch hooks run in
// parallel so registering our own hook is not sufficient.
onServerPrefetch(async () => {
    await promise
    maybeShowError(error.value)
})

// On client navigation:
// error.value starts null and is set after fetch
// watch picks it up as soon as it resolves.
watch(error, maybeShowError)

useSeoMeta({
    title: () => dataset.value?.properties.title,
    description: () => dataset.value?.properties.description,
})

const layerStore = useLayerStore()
const toast = useToast()
const { t } = useI18n()

const isAlreadyOnMap = computed(() => {
    if (!dataset.value) {
        return false
    }
    return layerStore.layers.some((l) => l.humanId === dataset.value!.id)
})

function addToMap() {
    if (!dataset.value || isAlreadyOnMap.value) {
        return
    }
    try {
        layerStore.addLayer(makeServerLayer(dataset.value))
    } catch (e) {
        log.error('Failed to add dataset to map', e instanceof Error ? e : new Error(String(e)))
        toast.add({
            color: 'error',
            title: t('dataset.addToMapError'),
        })
    }
}
</script>

<template>
    <div class="h-full overflow-y-auto">
        <article class="mx-auto max-w-3xl px-4 py-8">
            <nav class="mb-6 flex items-center justify-between">
                <UButton
                    :to="localePath('/map')"
                    icon="i-lucide-arrow-left"
                    color="neutral"
                    variant="subtle"
                >
                    {{ $t('dataset.backToMap') }}
                </UButton>

                <UButton
                    v-if="dataset && !isAlreadyOnMap"
                    icon="i-lucide-map"
                    color="primary"
                    @click="addToMap"
                >
                    {{ $t('dataset.addToMap') }}
                </UButton>
                <span
                    v-else-if="dataset && isAlreadyOnMap"
                    class="flex items-center gap-2 text-sm text-muted"
                >
                    <UIcon
                        name="i-lucide-check"
                        class="size-4"
                    />
                    {{ $t('dataset.alreadyOnMap') }}
                </span>
            </nav>

            <template v-if="dataset">
                <h1 class="mb-8 text-2xl font-bold">
                    {{ dataset.properties.title }}
                </h1>

                <DatasetViewContent
                    :dataset="dataset"
                    :distribution-collection="distributionCollection ?? null"
                />

                <section
                    v-if="dataset.properties.languages?.length"
                    class="mt-6"
                >
                    <h3 class="mb-2">
                        {{ $t('dataset.languages') }}
                    </h3>
                    <DatasetViewLanguages :languages="dataset.properties.languages" />
                </section>
            </template>
        </article>
    </div>
</template>
