<script lang="ts" setup>
import DrawingPanel from '~/components/debug/DrawingPanel.vue'

const isLayersPanelOpen = ref(false)
const isImportPanelOpen = ref(false)
const isImportLocalPanelOpen = ref(false)
const isDrawingOpen = ref(false)
const isSharePanelOpen = ref(false)
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
    isSharePanelOpen.value = !isSharePanelOpen.value
}
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
        <!--<DebugSharePanel
            v-if="isSharePanelOpen"
            @close="toggleStateConfig"
        />-->
        <div
            class="flex gap-2"
            v-if="
                !isLayersPanelOpen &&
                !isImportPanelOpen &&
                !isImportLocalPanelOpen &&
                !isDrawingOpen &&
                !isSharePanelOpen
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
            <UButton
                data-testid="debug-open-drawing-panel"
                @click="toggleDrawing"
            >
                {{ $t('debug.openDrawingPanel') }}
            </UButton>
            <UButton @click="toggleStateConfig">
                {{ $t('debug.openStateConfigPanel') }}
            </UButton>
        </div>
    </div>
</template>
