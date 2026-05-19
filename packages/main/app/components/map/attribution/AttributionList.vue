<script setup lang="ts">
import type { AttributionSource } from '@/composables/useAttributionSources'

import AttributionItem from './AttributionItem.vue'

const { sources } = defineProps<{
    sources: AttributionSource[]
}>()

const { t } = useI18n()
</script>

<template>
    <div
        v-if="sources.length > 0"
        class="fixed bottom-12 left-20 z-1000 max-w-50 bg-white px-1 text-sm text-black"
        data-testid="layers-copyrights"
    >
        <span>{{ t('footer.copyRightData') }}</span>
        <span
            v-for="(source, index) in sources"
            :key="source.name"
            class="d-inline-flex"
        >
            <AttributionItem
                :source-id="source.id"
                :source-name="source.name"
                :source-url="source.url"
                :has-data-disclaimer="false"
                :is-last="index === sources.length - 1"
            />
        </span>
    </div>
</template>
