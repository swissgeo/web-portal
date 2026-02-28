<script setup lang="ts">
import { IconButton } from '@swissgeo/skeleton'
import { ref, onMounted } from 'vue'

import { useStateConfig } from '~/composables/useStateConfig'

const { exportState, importState } = useStateConfig()

const jsonText = ref('')
const errorMessage = ref('')
const successMessage = ref('')

function handleExport() {
    errorMessage.value = ''
    successMessage.value = ''
    try {
        const state = exportState()
        jsonText.value = JSON.stringify(state, null, 2)
        successMessage.value = 'State exported'
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Failed to export state'
    }
}

function handleImport() {
    errorMessage.value = ''
    successMessage.value = ''
    if (!jsonText.value.trim()) {
        errorMessage.value = 'Please paste a JSON state config first'
        return
    }
    try {
        importState(jsonText.value)
        successMessage.value = 'State imported successfully'
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Failed to import state'
    }
}

onMounted(() => {
    // Expose on window for console testing
    if (import.meta.dev) {
        ;(window as Record<string, unknown>).__swissgeo = {
            exportState: () => {
                const state = exportState()
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(state, null, 2))
                return state
            },
            importState: (json: string) => {
                importState(json)
                // eslint-disable-next-line no-console
                console.log('State imported')
            },
        }
    }
})
</script>

<template>
    <div class="p-4">
        <div class="mb-2 flex items-center justify-between">
            <h3 class="text-lg font-semibold">State Config (JSON)</h3>
            <IconButton
                @click="$emit('close')"
                icon="X"
                title="Close"
            />
        </div>

        <div class="mb-2 flex gap-2">
            <UButton
                color="neutral"
                variant="outline"
                @click="handleExport"
            >
                Export
            </UButton>
            <UButton
                color="neutral"
                variant="outline"
                @click="handleImport"
            >
                Import
            </UButton>
        </div>

        <textarea
            v-model="jsonText"
            class="h-[180px] w-full rounded border border-gray-300 p-2 font-mono text-xs"
            placeholder='Click "Export" to see current state, or paste JSON here and click "Import"'
        />

        <div
            v-if="successMessage"
            class="mt-2 rounded bg-green-100 p-2 text-sm text-green-800"
        >
            {{ successMessage }}
        </div>
        <div
            v-if="errorMessage"
            class="mt-2 rounded bg-red-100 p-2 text-sm text-red-800"
        >
            {{ errorMessage }}
        </div>
    </div>
</template>
