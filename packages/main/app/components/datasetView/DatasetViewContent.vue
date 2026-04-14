<script lang="ts" setup>
import type { Dataset, DistributionCollection, Distribution, Link } from '@swissgeo/ogc'

import { computed } from 'vue'

import DatasetViewContact from './DatasetViewContact.vue'
import DatasetViewLinkList from './DatasetViewLinkList.vue'
import DatasetViewServiceList from './DatasetViewServiceList.vue'

const props = defineProps<{
    dataset: Dataset
    distributionCollection: DistributionCollection | null
}>()

const EXCLUDED_LINK_RELS = new Set(['self', 'collection', 'distributions'])

const displayLinks = computed<Link[]>(() => {
    if (!props.dataset.links) {
        return []
    }
    return props.dataset.links.filter((l) => !EXCLUDED_LINK_RELS.has(l.rel?.toLowerCase() ?? ''))
})

const serviceDistributions = computed<Distribution[]>(() => {
    if (!props.distributionCollection?.records) {
        return []
    }
    return props.distributionCollection.records.filter(
        (d) => d.properties.protocol !== 'OGC:GeoJSON'
    )
})
</script>

<template>
    <div class="flex flex-col gap-6">
        <section v-if="dataset.properties.description">
            <h3 class="mb-2">
                {{ $t('dataset.abstract') }}
            </h3>
            <p class="text-sm leading-relaxed">
                {{ dataset.properties.description }}
            </p>
        </section>

        <section v-if="dataset.properties.contacts?.length">
            <h3 class="mb-2">
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
            <h3 class="mb-2">
                {{ $t('dataset.links') }}
            </h3>
            <DatasetViewLinkList :links="displayLinks" />
        </section>

        <section v-if="serviceDistributions.length">
            <h3 class="mb-2">
                {{ $t('dataset.services') }}
            </h3>
            <DatasetViewServiceList :distributions="serviceDistributions" />
        </section>
    </div>
</template>
