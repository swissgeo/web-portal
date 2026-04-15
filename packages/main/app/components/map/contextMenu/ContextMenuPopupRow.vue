<script setup lang="ts">
import type { ContextMenuRow } from '~/types/contextMenu'

import { useClipboard } from '@vueuse/core'

const { labelLink, value } = defineProps<ContextMenuRow>()

const { copy, copied } = useClipboard({ legacy: true }) // legacy: true enables document.execCommand fallback for browsers without Clipboard API support

const resolvedLink = computed(() => {
    if (typeof labelLink === 'function') {
        return labelLink(value)
    }
    return labelLink
})
</script>

<template>
    <div class="flex items-center justify-between gap-4 px-4 py-2 hover:bg-gray-50">
        <ULink
            v-if="resolvedLink"
            :to="resolvedLink"
            target="_blank"
            rel="noopener noreferrer"
            class="min-w-30"
        >
            {{ label }}
        </ULink>
        <span
            v-else
            class="min-w-30"
        >
            {{ label }}
        </span>
        <span class="flex-1 text-sm whitespace-pre-line text-gray-700">
            {{ value }}
        </span>
        <UButton
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :class="copied ? 'text-green-500' : ''"
            color="neutral"
            variant="ghost"
            square
            size="sm"
            @click="copy(value)"
        />
    </div>
</template>

<style scoped></style>
