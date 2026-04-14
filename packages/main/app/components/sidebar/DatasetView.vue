<script lang="ts" setup>
import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import { DatasetViewContent, useDatasetViewStore } from '@swissgeo/skeleton'
import { computed } from 'vue'

const props = defineProps<{
    detailPagePath?: string
}>()

const datasetViewStore = useDatasetViewStore()
const layerStore = useLayerStore()

const { dataset, distributionCollection, isLoading, error } = useDatasetRecord(
    () => datasetViewStore.activeDatasetId
)

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
    <USlideover
        v-model:open="datasetViewStore.isOpen"
        :modal="false"
        :overlay="false"
        :dismissible="false"
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
                v-else-if="error"
                class="flex h-full items-center justify-center text-sm text-red-500"
            >
                {{ error.message }}
            </div>

            <DatasetViewContent
                v-else-if="dataset"
                :dataset="dataset"
                :distribution-collection="distributionCollection ?? null"
            />
        </template>

        <template #footer>
            <UButton
                v-if="dataset && !isAlreadyOnMap"
                icon="i-lucide-map"
                color="primary"
                class="w-full justify-center"
                @click="addToMap"
            >
                {{ $t('dataset.addToMap') }}
            </UButton>
            <div
                v-else-if="dataset && isAlreadyOnMap"
                class="flex w-full items-center justify-center gap-2 text-sm text-muted"
            >
                <UIcon
                    name="i-lucide-check"
                    class="size-4"
                />
                {{ $t('dataset.alreadyOnMap') }}
            </div>
            <UButton
                v-if="dataset && props.detailPagePath"
                :to="props.detailPagePath"
                icon="i-lucide-external-link"
                color="neutral"
                variant="subtle"
                class="w-full justify-center"
                @click="datasetViewStore.closeDatasetView()"
            >
                {{ $t('dataset.viewDetailPage') }}
            </UButton>
        </template>
    </USlideover>
</template>
