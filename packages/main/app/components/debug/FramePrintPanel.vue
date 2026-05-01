<script setup lang="ts">
import type {PrintOrientation} from '~/types/print';

import { usePrintFraming } from '@swissgeo/map'
import { IconButton } from '@swissgeo/skeleton'
import { printFormats, printOrientations  } from '~/types/print'

const emit = defineEmits<{
    close: []
}>()



const printFormatItems = ref(printFormats.map(format => ({
    label: format.toUpperCase(),
    value: format
})))
const selectedPrintFormat = ref("a4")

const printResolutionItems = ref([
    { label: '96 dpi', value: 96 },
    { label: '192 dpi', value: 192 },
    { label: '288 dpi', value: 288 },
])
const selectedPrintResolution = ref(96)


const printOrientationItems = ref(printOrientations)
const selectedPrintOrientation = ref<PrintOrientation>("landscape")

const { isEnabled} = usePrintFraming()



function handleClose() {
    emit('close')
}

</script>

<template>
  
    <div class="container">
        <div>
            <IconButton
                @click="handleClose"
                iconName="X"
                severity="secondary"
            >
            </IconButton>
        </div>
        <div>
            <UFormField
                orientation="horizontal"
                label="Enable Print Framing"
                class="w-72"
            >
                <USwitch id="enable-checkbox" v-model="isEnabled"  />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Print size"
                class="w-72"
            >
                <USelect v-model="selectedPrintFormat" :items="printFormatItems" />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Print resolution"
                class="w-72"
            >
                <USelect v-model="selectedPrintResolution" :items="printResolutionItems" />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Print orientation"
                class="w-72"
            >
                <USelect v-model="selectedPrintOrientation" :items="printOrientationItems" />
            </UFormField>
        </div>
    </div>
</template>


<style scoped>

.container {
  background: white;
  width: fit-content;
  height: fit-content;
  z-index: 10;
  min-width: 100px;
  min-height: 100px;
}
</style>