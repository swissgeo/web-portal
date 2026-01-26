<script lang="ts" setup>
const isLayersPanelOpen = ref(false)
const isImportPanelOpen = ref(false)
const isImportLocalPanelOpen = ref(false)
const isDrawingOpen = ref(false)
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
        <DebugDrawingPanel
            class="relative h-[400px] w-[350px] overflow-hidden bg-white shadow"
            v-if="isDrawingOpen"
            @close="toggleDrawing"
        >
        </DebugDrawingPanel>
        <div
            class="flex gap-2"
            v-if="!isLayersPanelOpen && !isImportPanelOpen && !isImportLocalPanelOpen && !isDrawingOpen"
        >
            <Button
                @click="toggleLayersPanel"
                class="cursor-pointer"
            >
                Open Layers Panel
            </Button>
            <Button
                @click="toggleImportPanel"
                class="cursor-pointer"
            >
                Open Import Layers Panel
            </Button>
            <Button
                @click="toggleLocalImportPanel"
                class="cursor-pointer"
            >
                Open Import Local Layers Panel
            </Button>
            <Button @click="toggleDrawing">
                Open Drawing Panel
            </Button>
        </div>
    </div>
</template>
