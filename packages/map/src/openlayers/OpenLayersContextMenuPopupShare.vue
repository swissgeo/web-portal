<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'

import { useClipboard } from '../composables/useClipboard.composable'

defineProps<{
    coordinate: [number, number] | null
}>()

const SHARE_URL = 'https://map.geo.admin.ch/?...'

const { copy, copied } = useClipboard()
</script>

<template>
    <div class="flex items-center justify-between gap-4 px-4 py-3">
        <span class="text-sm text-gray-700">
            {{ SHARE_URL }}
        </span>
        <button
            class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            @click="copy(SHARE_URL)"
        >
            <Check
                v-if="copied"
                :size="14"
                class="text-green-500"
            />
            <Copy
                v-else
                :size="14"
            />
        </button>
    </div>
</template>
