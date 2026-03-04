<script lang="ts" setup>
import DrawingPanel from '~/components/debug/DrawingPanel.vue'
import { useStateConfig } from '~/composables/useStateConfig'
import { ref, onMounted } from 'vue'

const isLayersPanelOpen = ref(false)
const isImportPanelOpen = ref(false)
const isImportLocalPanelOpen = ref(false)
const isDrawingOpen = ref(false)
const isStateConfigOpen = ref(false)
function toggleLayersPanel() {
    isLayersPanelOpen.value = !isLayersPanelOpen.value
}

function toggleImportPanel() {
    isImportPanelOpen.value = !isImportPanelOpen.value
}
function toggleLocalImportPanel() {
    isImportLocalPanelOpen.value = !isImportLocalPanelOpen.value
}
function toggleDrawing() {
    isDrawingOpen.value = !isDrawingOpen.value
}
function toggleStateConfig() {
    isStateConfigOpen.value = !isStateConfigOpen.value
}

const { exportState, importState } = useStateConfig()

onMounted(() => {
    if (import.meta.dev) {
        ;(window as Record<string, unknown>).__swissgeo = {
            exportState: () => {
                const state = exportState()
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(state, null, 2))
                return state
            },
            importState: async (json: string) => {
                await importState(json)
                // eslint-disable-next-line no-console
                console.log('State imported')
            },
        }
    }
})
</script>

<template>
    <div>
        <DebugLayersPanel
            class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
            v-if="isLayersPanelOpen"
            @close="toggleLayersPanel"
        ></DebugLayersPanel>
        <DebugImportLayersPanel
            class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
            v-if="isImportPanelOpen"
            @close="toggleImportPanel"
        >
        </DebugImportLayersPanel>
        <DebugImportLocalLayersPanel
            class="relative h-[300px] w-[800px] overflow-hidden bg-white shadow"
            v-if="isImportLocalPanelOpen"
            @close="toggleLocalImportPanel"
        >
        </DebugImportLocalLayersPanel>
        <DrawingPanel
            class="relative h-[400px] w-[350px] overflow-hidden bg-white shadow"
            v-if="isDrawingOpen"
            @close="toggleDrawing"
        >
        </DrawingPanel>
        <DebugStateConfigPanel
            class="relative h-[350px] w-[600px] overflow-hidden bg-white shadow"
            v-if="isStateConfigOpen"
            @close="toggleStateConfig"
        >
        </DebugStateConfigPanel>
        <div
            class="flex gap-2"
            v-if="
                !isLayersPanelOpen &&
                !isImportPanelOpen &&
                !isImportLocalPanelOpen &&
                !isDrawingOpen &&
                !isStateConfigOpen
            "
        >
            <UButton
                @click="toggleLayersPanel"
                class="cursor-pointer"
            >
                {{ $t('debug.openLayersPanel') }}
            </UButton>
            <UButton
                @click="toggleImportPanel"
                class="cursor-pointer"
            >
                {{ $t('debug.openImportLayersPanel') }}
            </UButton>
            <UButton
                @click="toggleLocalImportPanel"
                class="cursor-pointer"
            >
                {{ $t('debug.openImportLocalLayersPanel') }}
            </UButton>
            <UButton @click="toggleDrawing">
                {{ $t('debug.openDrawingPanel') }}
            </UButton>
            <UButton @click="toggleStateConfig">
                {{ $t('debug.openStateConfigPanel') }}
            </UButton>
        </div>
    </div>
</template>
