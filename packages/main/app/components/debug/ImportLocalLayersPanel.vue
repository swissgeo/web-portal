<script setup lang="ts">
import { IconButton } from '@swissgeo/skeleton'
import { useFileImport } from '~/composables/useFileImport'

const { importFile } = useFileImport()

const inputLocalFile = useTemplateRef<HTMLInputElement>('inputLocalFile')
const filePathInfo = ref('')
const selectedFile = ref<File | undefined>()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const acceptedFileTypes = ['.kml', '.kmz', '.gpx', '.geojson', '.json']

async function handleImport() {
    if (!selectedFile.value) {
        errorMessage.value = 'Please select a file first'
        return
    }

    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
        await importFile(selectedFile.value)
        successMessage.value = `Successfully imported ${selectedFile.value.name}`
        // Clear the file input after successful import
        selectedFile.value = undefined
        filePathInfo.value = ''
        if (inputLocalFile.value) {
            inputLocalFile.value.value = ''
        }
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Failed to import file'
    } finally {
        isLoading.value = false
    }
}

function onFileSelected(evt: Event): void {
    const target = evt.target as HTMLInputElement
    const file = target?.files?.[0] ?? undefined
    selectedFile.value = file
    filePathInfo.value = file ? file.name : ''
    // Clear previous messages
    errorMessage.value = ''
    successMessage.value = ''
}
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <h3 class="mb-2 text-lg font-semibold">Import Local File</h3>
            <p class="text-sm text-gray-600">
                Supported formats: KML, KMZ, GPX, GeoJSON (.kml, .kmz, .gpx, .geojson, .json)
            </p>
        </div>

        <div class="flex items-center gap-2">
            <input
                ref="inputLocalFile"
                type="file"
                :accept="acceptedFileTypes.join(',')"
                hidden
                data-cy="file-input"
                @change="onFileSelected"
            />
            <Button
                class="btn btn-outline-group"
                type="button"
                data-cy="file-input-browse-button"
                :disabled="isLoading"
                @click="inputLocalFile?.click()"
            >
                Browse...
            </Button>
            <input
                type="text"
                class="flex-1 rounded border border-gray-300 px-3 py-2"
                :value="filePathInfo"
                placeholder="No file selected"
                readonly
                tabindex="-1"
                data-cy="file-input-text"
                @click="inputLocalFile?.click()"
            />
            <IconButton
                :disabled="!selectedFile || isLoading"
                @click="handleImport"
                icon="Upload"
                title="Import file"
            />
            <IconButton
                @click="$emit('close')"
                icon="X"
                title="Close"
            />
        </div>

        <!-- Success message -->
        <div
            v-if="successMessage"
            class="mt-3 rounded bg-green-100 p-2 text-sm text-green-800"
        >
            ✓ {{ successMessage }}
        </div>

        <!-- Error message -->
        <div
            v-if="errorMessage"
            class="mt-3 rounded bg-red-100 p-2 text-sm text-red-800"
        >
            ✗ {{ errorMessage }}
        </div>

        <!-- Loading indicator -->
        <div
            v-if="isLoading"
            class="mt-3 flex items-center gap-2 text-sm text-gray-600"
        >
            <span class="animate-spin">⏳</span>
            <span>Importing file...</span>
        </div>
    </div>
</template>
