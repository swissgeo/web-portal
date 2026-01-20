<script lang="ts" setup>
const isLayersPanelOpen = ref(false)
const isImportPanelOpen = ref(false)
const isImportLocalPanelOpen = ref(false)

function toggleLayersPanel() {
    isLayersPanelOpen.value = !isLayersPanelOpen.value
}

function toggleImportPanel() {
    isImportPanelOpen.value = !isImportPanelOpen.value
}
function toggleLocalImportPanel() {
    isImportLocalPanelOpen.value = !isImportLocalPanelOpen.value
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
        <div
            class="flex gap-2"
            v-if="!isLayersPanelOpen && !isImportPanelOpen"
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
        </div>
    </div>
</template>
