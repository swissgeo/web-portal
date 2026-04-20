<script lang="ts" setup>
import { useLayerStore, makeServerLayer } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { useDatasetPanelStore } from '@swissgeo/skeleton'
import { computed } from 'vue'

const props = defineProps<{
    detailPagePath?: string
}>()

const datasetPanelStore = useDatasetPanelStore()
const layerStore = useLayerStore()

const { dataset, distributionCollection, isLoading, error } = useDatasetRecord(
    () => datasetPanelStore.activeDatasetId
)

const isAlreadyOnMap = computed(() => {
    if (!dataset.value) {
        return false
    }
    return layerStore.layers.some((l) => l.humanId === dataset.value!.id)
})

const toast = useToast()
const { t } = useI18n()

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
    <USlideover
        v-model:open="datasetPanelStore.isOpen"
        :modal="false"
        :overlay="false"
        :dismissible="false"
        :title="dataset?.properties.title ?? ''"
        side="right"
        @update:open="
            (v) => {
                if (!v) datasetPanelStore.closeDatasetPanel()
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

            <DatasetDetail
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
                @click="datasetPanelStore.closeDatasetPanel()"
            >
                {{ $t('dataset.viewDetailPage') }}
            </UButton>
        </template>
    </USlideover>
</template>
