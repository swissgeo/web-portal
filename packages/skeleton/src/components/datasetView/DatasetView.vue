<script lang="ts" setup>
import type { Dataset, DistributionCollection, Distribution, Link } from '@swissgeo/ogc'

import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDatasetViewStore } from '@/stores/datasetView'

import DatasetViewContact from './DatasetViewContact.vue'
import DatasetViewLinkList from './DatasetViewLinkList.vue'
import DatasetViewServiceList from './DatasetViewServiceList.vue'

const datasetViewStore = useDatasetViewStore()
const layerStore = useLayerStore()
const { locale } = useI18n()

const runtimeConfig = useRuntimeConfig()

const dataset = ref<Dataset | null>(null)
const distributionCollection = ref<DistributionCollection | null>(null)
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

async function fetchDataset(id: string) {
    isLoading.value = true
    fetchError.value = null
    dataset.value = null
    distributionCollection.value = null
    try {
        const url = `${runtimeConfig.public.ogcApiEndpoint}/items/${id}?language=${locale.value}`
        const record = await $fetch<Dataset>(url)
        dataset.value = record

        const distributionsLink = record.links?.find((l) => l.rel === 'distributions')
        if (distributionsLink?.href) {
            distributionCollection.value = await $fetch<DistributionCollection>(
                `${distributionsLink.href}?language=${locale.value}`
            )
        }
    } catch (e) {
        fetchError.value = String(e)
    } finally {
        isLoading.value = false
    }
}

watch(
    () => datasetViewStore.activeDatasetId,
    (id) => {
        if (id) {
            void fetchDataset(id)
        } else {
            dataset.value = null
            distributionCollection.value = null
        }
    },
    { immediate: true }
)

watch(locale, () => {
    if (datasetViewStore.activeDatasetId) {
        void fetchDataset(datasetViewStore.activeDatasetId)
    }
})

const EXCLUDED_LINK_RELS = new Set(['self', 'collection', 'distributions'])
const displayLinks = computed<Link[]>(() => {
    if (!dataset.value?.links) return []
    return dataset.value.links.filter((l) => !EXCLUDED_LINK_RELS.has(l.rel?.toLowerCase() ?? ''))
})

const serviceDistributions = computed<Distribution[]>(() => {
    if (!distributionCollection.value?.records) return []
    return distributionCollection.value.records.filter(
        (d) => d.properties.protocol !== 'OGC:GeoJSON'
    )
})

const isAlreadyOnMap = computed(() => {
    if (!dataset.value) return false
    return layerStore.layers.some((l) => l.humanId === dataset.value!.id)
})

function addToMap() {
    if (!dataset.value || isAlreadyOnMap.value) return
    layerStore.addLayer(makeServerLayer(dataset.value))
}
</script>

<template>
    <USlideover
        v-model:open="datasetViewStore.isOpen"
        :modal="false"
        :overlay="false"
        :title="dataset?.properties.title ?? ''"
        side="right"
        @update:open="
            (v) => {
                if (!v) datasetViewStore.closeDatasetView()
            }
        "
    >
        <template #body>
            <div
                v-if="isLoading"
                class="flex h-full items-center justify-center"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    class="size-6 animate-spin text-muted"
                />
            </div>

            <div
                v-else-if="fetchError"
                class="flex h-full items-center justify-center text-sm text-red-500"
            >
                {{ fetchError }}
            </div>

            <div
                v-else-if="dataset"
                class="flex flex-col gap-6"
            >
                <section v-if="dataset.properties.description">
                    <h3 class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                        {{ $t('dataset.abstract') }}
                    </h3>
                    <p class="text-sm leading-relaxed">
                        {{ dataset.properties.description }}
                    </p>
                </section>

                <section v-if="dataset.properties.contacts?.length">
                    <h3 class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                        {{ $t('dataset.contacts') }}
                    </h3>
                    <div class="flex flex-col gap-3">
                        <DatasetViewContact
                            v-for="(contact, i) in dataset.properties.contacts"
                            :key="i"
                            :contact="contact"
                        />
                    </div>
                </section>

                <section v-if="displayLinks.length">
                    <h3 class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                        {{ $t('dataset.links') }}
                    </h3>
                    <DatasetViewLinkList :links="displayLinks" />
                </section>

                <section v-if="serviceDistributions.length">
                    <h3 class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                        {{ $t('dataset.services') }}
                    </h3>
                    <DatasetViewServiceList :distributions="serviceDistributions" />
                </section>
            </div>
        </template>

        <template #footer>
            <UButton
                v-if="dataset && !isAlreadyOnMap"
                icon="i-lucide-map"
                color="primary"
                class="w-full justify-center"
                @click="addToMap"
            >
                {{ $t('dataset.add_to_map') }}
            </UButton>
            <div
                v-else-if="dataset && isAlreadyOnMap"
                class="flex w-full items-center justify-center gap-2 text-sm text-muted"
            >
                <UIcon
                    name="i-lucide-check"
                    class="size-4"
                />
                {{ $t('dataset.already_on_map') }}
            </div>
        </template>
    </USlideover>
</template>
