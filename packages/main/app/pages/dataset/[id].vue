<script lang="ts" setup>
import { useLayerStore, makeServerLayer } from '@swissgeo/layers'

const route = useRoute()
const localePath = useLocalePath()

const id = computed(() => route.params.id as string)

const { dataset, distributionCollection, error } = useDatasetRecord(id)

useSeoMeta({
    title: () => dataset.value?.properties.title,
    description: () => dataset.value?.properties.description,
})

const layerStore = useLayerStore()

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
    layerStore.addLayer(makeServerLayer(dataset.value))
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

            <p
                v-if="error"
                class="flex items-center justify-center text-sm text-red-500"
            >
                {{ error.message }}
            </p>

            <template v-else-if="dataset">
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
