<script setup lang="ts">
import type { AttributionSource } from '@swissgeo/map'

import MapFooterAttributionItem from './MapFooterAttributionItem.vue'

const { sources } = defineProps<{
    sources: AttributionSource[]
}>()

const { t } = useI18n()
</script>

<template>
    <div
        v-if="sources.length > 0"
        class="fixed bottom-[3rem] left-[5rem] z-[1000] max-w-[200px] bg-white px-1 text-sm text-black"
        data-cy="layers-copyrights"
    >
        <span>{{ t('footer.copyRightData') }}</span>
        <span
            v-for="(source, index) in sources"
            :key="source.name"
            class="d-inline-flex"
        >
            <MapFooterAttributionItem
                :source-id="source.id"
                :source-name="source.name"
                :source-url="source.url"
                :has-data-disclaimer="false"
                :is-last="index === sources.length - 1"
            />
        </span>
    </div>
</template>
